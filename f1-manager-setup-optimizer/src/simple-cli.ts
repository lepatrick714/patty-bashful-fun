import { SetupCalculator } from './calculator';
import { IterativeOptimizer } from './optimizer';
import { SetupParameters, FeedbackType, Biasfeedback } from './types';
import * as readline from 'readline';

/**
 * Simplified CLI that doesn't require external dependencies
 */
export class SimpleCLI {
  private calculator: SetupCalculator;
  private optimizer: IterativeOptimizer;
  private currentSetup: SetupParameters;
  private rl: readline.Interface;

  constructor() {
    this.calculator = new SetupCalculator();
    this.optimizer = new IterativeOptimizer();
    this.currentSetup = this.getMiddleSetup();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Start the CLI application
   */
  async start(): Promise<void> {
    console.clear();
    this.printWelcome();
    await this.mainLoop();
  }

  /**
   * Main application loop
   */
  private async mainLoop(): Promise<void> {
    while (true) {
      this.displayCurrentSetup();
      await this.showMenu();
    }
  }

  /**
   * Print welcome message
   */
  private printWelcome(): void {
    console.log('=====================================');
    console.log('    F1 MANAGER SETUP OPTIMIZER');
    console.log('=====================================\n');
    console.log('🏎️  Welcome to the F1 Manager Setup Calculator!\n');
    console.log('This tool helps you find optimal car setups through iterative practice sessions.\n');
    console.log('Process:');
    console.log('1. Set your current practice setup');
    console.log('2. Run practice session in F1 Manager');
    console.log('3. Input the feedback you received');
    console.log('4. Get optimized setup suggestions');
    console.log('5. Repeat until you achieve 99-100% confidence\n');
  }

  /**
   * Display current setup
   */
  private displayCurrentSetup(): void {
    const stats = this.optimizer.getStats();
    const confidence = this.calculator.calculateConfidence(this.calculator.calculateBias(this.currentSetup));
    
    console.log('\n📊 Current Setup:');
    console.log('┌─────────────────────┬─────────┬─────────────┐');
    console.log('│ Parameter           │ Value   │ Percentage  │');
    console.log('├─────────────────────┼─────────┼─────────────┤');
    console.log(`│ Front Wing Angle    │ ${this.formatValue(this.currentSetup.frontWingAngle)} │ ${this.formatPercentage(this.currentSetup.frontWingAngle)} │`);
    console.log(`│ Rear Wing Angle     │ ${this.formatValue(this.currentSetup.rearWingAngle)} │ ${this.formatPercentage(this.currentSetup.rearWingAngle)} │`);
    console.log(`│ Anti-Roll Dist.     │ ${this.formatValue(this.currentSetup.antiRollDistribution)} │ ${this.formatPercentage(this.currentSetup.antiRollDistribution)} │`);
    console.log(`│ Tyre Camber         │ ${this.formatValue(this.currentSetup.tyreCamber)} │ ${this.formatPercentage(this.currentSetup.tyreCamber)} │`);
    console.log(`│ Toe-Out             │ ${this.formatValue(this.currentSetup.toeOut)} │ ${this.formatPercentage(this.currentSetup.toeOut)} │`);
    console.log('└─────────────────────┴─────────┴─────────────┘');
    
    console.log(`\n📈 Current Confidence: ${confidence.toFixed(1)}%`);
    console.log(`🎯 Attempt: #${stats.attemptCount + 1}`);
    
    if (stats.attemptCount > 0) {
      console.log(`🔍 Candidates Remaining: ${stats.totalCandidates}`);
      const eta = this.optimizer.estimateAttemptsToOptimal();
      if (eta > 0) {
        console.log(`⏱️  Estimated attempts to optimal: ${eta}`);
      }
    }
  }

  /**
   * Show main menu
   */
  private async showMenu(): Promise<void> {
    console.log('\n📋 What would you like to do?');
    console.log('1. Set current setup manually');
    console.log('2. Run practice and input feedback');
    console.log('3. Get setup recommendations');
    console.log('4. Analyze current setup');
    console.log('5. Reset session');
    console.log('6. Exit');
    
    const choice = await this.question('\nEnter your choice (1-6): ');
    
    switch (choice.trim()) {
      case '1':
        await this.setSetupManually();
        break;
      case '2':
        await this.runPracticeSession();
        break;
      case '3':
        await this.showRecommendations();
        break;
      case '4':
        await this.analyzeSetup();
        break;
      case '5':
        this.resetSession();
        break;
      case '6':
        console.log('\nThanks for using F1 Manager Setup Optimizer! 🏁');
        process.exit(0);
      default:
        console.log('\n❌ Invalid choice. Please try again.');
        await this.pause();
    }
  }

  /**
   * Set setup manually
   */
  private async setSetupManually(): Promise<void> {
    console.log('\n📝 Enter setup values (0-100):');
    
    try {
      const frontWing = await this.getNumberInput('Front Wing Angle (0-100): ');
      const rearWing = await this.getNumberInput('Rear Wing Angle (0-100): ');
      const antiRoll = await this.getNumberInput('Anti-Roll Distribution (0-100): ');
      const camber = await this.getNumberInput('Tyre Camber (0-100): ');
      const toeOut = await this.getNumberInput('Toe-Out (0-100): ');

      this.currentSetup = {
        frontWingAngle: frontWing / 100,
        rearWingAngle: rearWing / 100,
        antiRollDistribution: antiRoll / 100,
        tyreCamber: camber / 100,
        toeOut: toeOut / 100
      };

      console.log('\n✅ Setup updated successfully!');
    } catch (error) {
      console.log('\n❌ Invalid input. Setup not changed.');
    }
    
    await this.pause();
  }

  /**
   * Run practice session
   */
  private async runPracticeSession(): Promise<void> {
    console.log('\n🏁 Practice Session Feedback');
    console.log('After running practice with your current setup, what feedback did you receive?\n');

    try {
      const feedback: Biasfeedback = {
        oversteer: await this.getFeedbackInput('Oversteer'),
        brakingStability: await this.getFeedbackInput('Braking Stability'),
        cornering: await this.getFeedbackInput('Cornering'),
        traction: await this.getFeedbackInput('Traction'),
        straights: await this.getFeedbackInput('Straights')
      };

      // Record the attempt
      this.optimizer.recordAttempt(this.currentSetup, feedback);

      console.log('\n✅ Feedback recorded!');
      
      // Show recommendations based on this feedback
      await this.showRecommendationsFromFeedback();
      
    } catch (error) {
      console.log('\n❌ Invalid input. Please try again.');
    }
    
    await this.pause();
  }

  /**
   * Get feedback for a metric
   */
  private async getFeedbackInput(metricName: string): Promise<FeedbackType> {
    console.log(`\n${metricName}:`);
    console.log('1. Optimal (99-100% confidence)');
    console.log('2. Great (96-98% confidence)');
    console.log('3. Good (90-95% confidence)');
    console.log('4. Bad (<90% confidence)');
    
    const choice = await this.question('Choose (1-4): ');
    
    switch (choice.trim()) {
      case '1': return FeedbackType.OPTIMAL;
      case '2': return FeedbackType.GREAT;
      case '3': return FeedbackType.GOOD;
      case '4': return FeedbackType.BAD;
      default: throw new Error('Invalid choice');
    }
  }

  /**
   * Show recommendations from feedback
   */
  private async showRecommendationsFromFeedback(): Promise<void> {
    const recommendations = this.optimizer.getBestRecommendations(3);
    
    if (recommendations.length === 0) {
      console.log('\n❌ No suitable setups found. Try different feedback.');
      return;
    }

    console.log(`\n✨ Top ${recommendations.length} recommended setups:`);
    this.displayRecommendations(recommendations);
    
    if (this.optimizer.isOptimal()) {
      console.log('\n🎉 Congratulations! You\'ve reached optimal setup!');
    }

    console.log('\nWould you like to:');
    console.log('1. Use the first recommendation');
    console.log('2. Keep current setup');
    
    const choice = await this.question('Enter choice (1-2): ');
    
    if (choice.trim() === '1' && recommendations.length > 0) {
      this.currentSetup = recommendations[0];
      console.log('\n✅ Setup updated to recommendation #1');
    }
  }

  /**
   * Show general recommendations
   */
  private async showRecommendations(): Promise<void> {
    const recommendations = this.calculator.findOptimalSetup();
    console.log(`\n✨ Top 5 optimal setups:`);
    this.displayRecommendations(recommendations.slice(0, 5));
    await this.pause();
  }

  /**
   * Display recommendations table
   */
  private displayRecommendations(recommendations: SetupParameters[]): void {
    console.log('\n┌────┬──────────┬─────────┬──────────┬────────┬─────────┬────────────┐');
    console.log('│ #  │ Fr.Wing  │ Re.Wing │ AntiRoll │ Camber │ Toe-Out │ Confidence │');
    console.log('├────┼──────────┼─────────┼──────────┼────────┼─────────┼────────────┤');
    
    recommendations.forEach((setup, index) => {
      const confidence = this.optimizer.predictConfidence(setup);
      console.log(`│ ${(index + 1).toString().padStart(2)} │ ${this.formatPercentage(setup.frontWingAngle).padStart(8)} │ ${this.formatPercentage(setup.rearWingAngle).padStart(7)} │ ${this.formatPercentage(setup.antiRollDistribution).padStart(8)} │ ${this.formatPercentage(setup.tyreCamber).padStart(6)} │ ${this.formatPercentage(setup.toeOut).padStart(7)} │ ${confidence.toFixed(1).padStart(9)}% │`);
    });
    
    console.log('└────┴──────────┴─────────┴──────────┴────────┴─────────┴────────────┘');
  }

  /**
   * Analyze current setup
   */
  private async analyzeSetup(): Promise<void> {
    const bias = this.calculator.calculateBias(this.currentSetup);
    const confidence = this.calculator.calculateConfidence(bias);
    
    console.log('\n📊 Current Setup Analysis:');
    console.log('┌─────────────────┬─────────┬──────────────────┐');
    console.log('│ Bias Metric     │ Value   │ Expected Feedback│');
    console.log('├─────────────────┼─────────┼──────────────────┤');
    console.log(`│ Oversteer       │ ${bias.oversteer.toFixed(3).padStart(7)} │ ${this.classifyFeedback(bias).padStart(16)} │`);
    console.log(`│ Braking Stab.   │ ${bias.brakingStability.toFixed(3).padStart(7)} │ ${this.classifyFeedback(bias).padStart(16)} │`);
    console.log(`│ Cornering       │ ${bias.cornering.toFixed(3).padStart(7)} │ ${this.classifyFeedback(bias).padStart(16)} │`);
    console.log(`│ Traction        │ ${bias.traction.toFixed(3).padStart(7)} │ ${this.classifyFeedback(bias).padStart(16)} │`);
    console.log(`│ Straights       │ ${bias.straights.toFixed(3).padStart(7)} │ ${this.classifyFeedback(bias).padStart(16)} │`);
    console.log('└─────────────────┴─────────┴──────────────────┘');
    
    console.log(`\nPredicted Confidence: ${confidence.toFixed(1)}%`);
    
    await this.pause();
  }

  /**
   * Reset session
   */
  private resetSession(): void {
    this.optimizer.reset();
    this.currentSetup = this.getMiddleSetup();
    console.log('\n✅ Session reset successfully!');
  }

  /**
   * Helper methods
   */
  private getMiddleSetup(): SetupParameters {
    return {
      frontWingAngle: 0.5,
      rearWingAngle: 0.5,
      antiRollDistribution: 0.5,
      tyreCamber: 0.5,
      toeOut: 0.5
    };
  }

  private formatValue(value: number): string {
    return (value * 100).toFixed(1).padStart(5);
  }

  private formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  private classifyFeedback(bias: any): string {
    const feedback = this.calculator.classifyFeedback(bias);
    return feedback.toUpperCase();
  }

  private async getNumberInput(prompt: string): Promise<number> {
    while (true) {
      const input = await this.question(prompt);
      const num = parseFloat(input);
      
      if (!isNaN(num) && num >= 0 && num <= 100) {
        return num;
      }
      
      console.log('Please enter a number between 0 and 100.');
    }
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private async pause(): Promise<void> {
    await this.question('\nPress Enter to continue...');
    console.clear();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.rl.close();
  }
}