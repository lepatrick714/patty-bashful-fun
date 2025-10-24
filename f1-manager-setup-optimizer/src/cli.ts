import { SetupCalculator } from './calculator';
import { SetupParameters, FeedbackType, Biasfeedback } from './types';
import chalk from 'chalk';
import Table from 'cli-table3';

/**
 * Command Line Interface for F1 Manager Setup Optimizer
 */
export class CLI {
  private calculator: SetupCalculator;
  private currentSetup: SetupParameters;
  private practiceAttempts: number;

  constructor() {
    this.calculator = new SetupCalculator();
    this.currentSetup = this.getMiddleSetup();
    this.practiceAttempts = 0;
  }

  /**
   * Start the interactive CLI session
   */
  async start(): Promise<void> {
    this.printWelcome();
    
    while (true) {
      await this.showMainMenu();
    }
  }

  /**
   * Print welcome message and instructions
   */
  private printWelcome(): void {
    console.clear();
    console.log(chalk.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.blue.bold('║                F1 MANAGER SETUP OPTIMIZER                   ║'));
    console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
    console.log();
    console.log(chalk.yellow('🏎️  Welcome to the F1 Manager Setup Calculator!'));
    console.log();
    console.log('This tool helps you find optimal car setups through iterative practice sessions.');
    console.log('Follow these steps:');
    console.log();
    console.log(chalk.green('1.') + ' Set your current practice setup');
    console.log(chalk.green('2.') + ' Run practice session in F1 Manager');
    console.log(chalk.green('3.') + ' Input the feedback you received');
    console.log(chalk.green('4.') + ' Get optimized setup suggestions');
    console.log(chalk.green('5.') + ' Repeat until you achieve 99-100% confidence');
    console.log();
  }

  /**
   * Show main menu and handle user input
   */
  private async showMainMenu(): Promise<void> {
    console.log(chalk.cyan('Current Practice Attempt: ') + chalk.bold(`#${this.practiceAttempts + 1}`));
    console.log();
    
    this.displayCurrentSetup();
    
    console.log(chalk.yellow('\n📋 What would you like to do?'));
    console.log('1. Set current setup manually');
    console.log('2. Run practice and input feedback');
    console.log('3. Get setup recommendations');
    console.log('4. Analyze current setup');
    console.log('5. Reset session');
    console.log('6. Exit');
    console.log();

    const choice = await this.getUserInput('Enter your choice (1-6): ');
    
    switch (choice.trim()) {
      case '1':
        await this.setSetupManually();
        break;
      case '2':
        await this.runPracticeSession();
        break;
      case '3':
        await this.getRecommendations();
        break;
      case '4':
        await this.analyzeCurrentSetup();
        break;
      case '5':
        this.resetSession();
        break;
      case '6':
        console.log(chalk.green('Thanks for using F1 Manager Setup Optimizer! 🏁'));
        process.exit(0);
      default:
        console.log(chalk.red('Invalid choice. Please try again.'));
        await this.pause();
    }
  }

  /**
   * Display current setup in a formatted table
   */
  private displayCurrentSetup(): void {
    const table = new Table({
      head: ['Parameter', 'Value', 'Percentage'],
      style: { head: ['cyan'] }
    });

    const formatted = this.calculator.formatSetup(this.currentSetup);
    
    table.push(
      ['Front Wing Angle', this.formatSliderValue(this.currentSetup.frontWingAngle), formatted['Front Wing']],
      ['Rear Wing Angle', this.formatSliderValue(this.currentSetup.rearWingAngle), formatted['Rear Wing']],
      ['Anti-Roll Distribution', this.formatSliderValue(this.currentSetup.antiRollDistribution), formatted['Anti-Roll']],
      ['Tyre Camber', this.formatSliderValue(this.currentSetup.tyreCamber), formatted['Tyre Camber']],
      ['Toe-Out', this.formatSliderValue(this.currentSetup.toeOut), formatted['Toe-Out']]
    );

    console.log(chalk.bold('\n🔧 Current Setup:'));
    console.log(table.toString());
  }

  /**
   * Set setup parameters manually
   */
  private async setSetupManually(): Promise<void> {
    console.log(chalk.yellow('\n📝 Enter setup values (0-100):'));
    
    const frontWing = await this.getNumberInput('Front Wing Angle (0-100): ', 0, 100);
    const rearWing = await this.getNumberInput('Rear Wing Angle (0-100): ', 0, 100);
    const antiRoll = await this.getNumberInput('Anti-Roll Distribution (0-100): ', 0, 100);
    const camber = await this.getNumberInput('Tyre Camber (0-100): ', 0, 100);
    const toeOut = await this.getNumberInput('Toe-Out (0-100): ', 0, 100);

    this.currentSetup = {
      frontWingAngle: frontWing / 100,
      rearWingAngle: rearWing / 100,
      antiRollDistribution: antiRoll / 100,
      tyreCamber: camber / 100,
      toeOut: toeOut / 100
    };

    console.log(chalk.green('✅ Setup updated successfully!'));
    await this.pause();
  }

  /**
   * Run practice session and collect feedback
   */
  private async runPracticeSession(): Promise<void> {
    console.log(chalk.yellow('\n🏁 Practice Session Feedback'));
    console.log('After running practice with your current setup, what feedback did you receive?');
    console.log();

    const feedback: Biasfeedback = {
      oversteer: await this.getFeedbackInput('Oversteer: '),
      brakingStability: await this.getFeedbackInput('Braking Stability: '),
      cornering: await this.getFeedbackInput('Cornering: '),
      traction: await this.getFeedbackInput('Traction: '),
      straights: await this.getFeedbackInput('Straights: ')
    };

    console.log(chalk.green('\n✅ Feedback recorded!'));
    this.practiceAttempts++;
    
    // Automatically show recommendations based on feedback
    await this.showRecommendationsFromFeedback(feedback);
  }

  /**
   * Get feedback input for a specific bias metric
   */
  private async getFeedbackInput(prompt: string): Promise<FeedbackType> {
    console.log(`\n${prompt}`);
    console.log('1. Optimal (99-100% confidence)');
    console.log('2. Great (96-98% confidence)');
    console.log('3. Good (90-95% confidence)');
    console.log('4. Bad (<90% confidence)');
    
    while (true) {
      const choice = await this.getUserInput('Choose (1-4): ');
      
      switch (choice.trim()) {
        case '1': return FeedbackType.OPTIMAL;
        case '2': return FeedbackType.GREAT;
        case '3': return FeedbackType.GOOD;
        case '4': return FeedbackType.BAD;
        default:
          console.log(chalk.red('Invalid choice. Please enter 1-4.'));
      }
    }
  }

  /**
   * Show setup recommendations based on feedback
   */
  private async showRecommendationsFromFeedback(feedback: Biasfeedback): Promise<void> {
    console.log(chalk.yellow('\n🎯 Finding optimal setups...'));
    
    const recommendations = this.calculator.findOptimalSetup(feedback);
    
    if (recommendations.length === 0) {
      console.log(chalk.red('No suitable setups found. Try adjusting your feedback.'));
      await this.pause();
      return;
    }

    console.log(chalk.green(`\n✨ Found ${recommendations.length} recommended setups:`));
    
    this.displayRecommendations(recommendations.slice(0, 3)); // Show top 3
    
    console.log(chalk.yellow('\nWould you like to:'));
    console.log('1. Use the first recommendation');
    console.log('2. Choose a different recommendation');
    console.log('3. Keep current setup');
    
    const choice = await this.getUserInput('Enter choice (1-3): ');
    
    switch (choice.trim()) {
      case '1':
        this.currentSetup = recommendations[0];
        console.log(chalk.green('✅ Setup updated to recommendation #1'));
        break;
      case '2':
        await this.selectRecommendation(recommendations);
        break;
      case '3':
        console.log('Keeping current setup.');
        break;
    }
    
    await this.pause();
  }

  /**
   * Display setup recommendations in a table
   */
  private displayRecommendations(recommendations: SetupParameters[]): void {
    const table = new Table({
      head: ['#', 'Front Wing', 'Rear Wing', 'Anti-Roll', 'Camber', 'Toe-Out', 'Confidence'],
      style: { head: ['cyan'] }
    });

    recommendations.forEach((setup, index) => {
      const bias = this.calculator.calculateBias(setup);
      const confidence = this.calculator.calculateConfidence(bias);
      const formatted = this.calculator.formatSetup(setup);
      
      table.push([
        (index + 1).toString(),
        formatted['Front Wing'],
        formatted['Rear Wing'], 
        formatted['Anti-Roll'],
        formatted['Tyre Camber'],
        formatted['Toe-Out'],
        `${confidence.toFixed(1)}%`
      ]);
    });

    console.log(table.toString());
  }

  /**
   * Let user select from multiple recommendations
   */
  private async selectRecommendation(recommendations: SetupParameters[]): Promise<void> {
    const choice = await this.getNumberInput(`Select recommendation (1-${recommendations.length}): `, 1, recommendations.length);
    this.currentSetup = recommendations[choice - 1];
    console.log(chalk.green(`✅ Setup updated to recommendation #${choice}`));
  }

  /**
   * Get general recommendations without feedback constraints
   */
  private async getRecommendations(): Promise<void> {
    console.log(chalk.yellow('\n🎯 Finding optimal setups (without feedback constraints)...'));
    
    const recommendations = this.calculator.findOptimalSetup();
    console.log(chalk.green(`\n✨ Top ${Math.min(5, recommendations.length)} optimal setups:`));
    
    this.displayRecommendations(recommendations.slice(0, 5));
    await this.pause();
  }

  /**
   * Analyze current setup and show predicted performance
   */
  private async analyzeCurrentSetup(): Promise<void> {
    const bias = this.calculator.calculateBias(this.currentSetup);
    const confidence = this.calculator.calculateConfidence(bias);
    const feedback = this.calculator.classifyFeedback(bias);

    console.log(chalk.yellow('\n📊 Current Setup Analysis:'));
    
    const biasTable = new Table({
      head: ['Bias Metric', 'Value', 'Expected Feedback'],
      style: { head: ['cyan'] }
    });

    biasTable.push(
      ['Oversteer', bias.oversteer.toFixed(3), this.getFeedbackColor(feedback)],
      ['Braking Stability', bias.brakingStability.toFixed(3), this.getFeedbackColor(feedback)],
      ['Cornering', bias.cornering.toFixed(3), this.getFeedbackColor(feedback)],
      ['Traction', bias.traction.toFixed(3), this.getFeedbackColor(feedback)],
      ['Straights', bias.straights.toFixed(3), this.getFeedbackColor(feedback)]
    );

    console.log(biasTable.toString());
    console.log(chalk.bold(`\nPredicted Confidence: ${this.getConfidenceColor(confidence)}%`));
    console.log(chalk.bold(`Overall Expected Feedback: ${this.getFeedbackColor(feedback)}`));
    
    await this.pause();
  }

  /**
   * Reset the session
   */
  private resetSession(): void {
    this.currentSetup = this.getMiddleSetup();
    this.practiceAttempts = 0;
    console.log(chalk.green('✅ Session reset successfully!'));
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

  private formatSliderValue(value: number): string {
    return `${(value * 100).toFixed(1)}`;
  }

  private getFeedbackColor(feedback: FeedbackType): string {
    switch (feedback) {
      case FeedbackType.OPTIMAL: return chalk.green.bold('OPTIMAL');
      case FeedbackType.GREAT: return chalk.blue.bold('GREAT');
      case FeedbackType.GOOD: return chalk.yellow.bold('GOOD');
      case FeedbackType.BAD: return chalk.red.bold('BAD');
    }
  }

  private getConfidenceColor(confidence: number): string {
    if (confidence >= 99) return chalk.green.bold(confidence.toFixed(1));
    if (confidence >= 96) return chalk.blue.bold(confidence.toFixed(1));
    if (confidence >= 90) return chalk.yellow.bold(confidence.toFixed(1));
    return chalk.red.bold(confidence.toFixed(1));
  }

  private async getUserInput(prompt: string): Promise<string> {
    process.stdout.write(prompt);
    return new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }

  private async getNumberInput(prompt: string, min: number, max: number): Promise<number> {
    while (true) {
      const input = await this.getUserInput(prompt);
      const num = parseFloat(input);
      
      if (!isNaN(num) && num >= min && num <= max) {
        return num;
      }
      
      console.log(chalk.red(`Please enter a number between ${min} and ${max}.`));
    }
  }

  private async pause(): Promise<void> {
    await this.getUserInput('\nPress Enter to continue...');
    console.clear();
  }
}