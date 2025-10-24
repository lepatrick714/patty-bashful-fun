import { SetupCalculator } from './calculator';
import { SetupParameters, FeedbackType, Biasfeedback, CarBias } from './types';

/**
 * Represents a candidate setup with its performance metrics
 */
interface SetupCandidate {
  setup: SetupParameters;
  bias: CarBias;
  confidence: number;
  feedback: Biasfeedback;
  score: number;
}

/**
 * Iterative optimization engine that narrows down to optimal setups
 */
export class IterativeOptimizer {
  private calculator: SetupCalculator;
  private candidates: SetupCandidate[];
  private attemptHistory: Array<{
    setup: SetupParameters;
    feedback: Biasfeedback;
    confidence: number;
  }>;

  constructor() {
    this.calculator = new SetupCalculator();
    this.candidates = [];
    this.attemptHistory = [];
    this.initializeCandidates();
  }

  /**
   * Initialize candidate pool with diverse setups
   */
  private initializeCandidates(): void {
    this.candidates = [];
    
    // Generate a smaller, more focused set of candidates
    const steps = 10; // Reduced from 20 for better performance
    
    for (let fw = 0; fw <= steps; fw += 2) {
      for (let rw = 0; rw <= steps; rw += 2) {
        for (let ar = 0; ar <= steps; ar += 2) {
          for (let tc = 0; tc <= steps; tc += 2) {
            for (let to = 0; to <= steps; to += 2) {
              const setup: SetupParameters = {
                frontWingAngle: fw / steps,
                rearWingAngle: rw / steps,
                antiRollDistribution: ar / steps,
                tyreCamber: tc / steps,
                toeOut: to / steps
              };

              const bias = this.calculator.calculateBias(setup);
              const confidence = this.calculator.calculateConfidence(bias);
              const feedback = this.generateFeedback(bias);
              const score = this.calculateScore(setup, bias, confidence);

              this.candidates.push({
                setup,
                bias,
                confidence,
                feedback,
                score
              });
            }
          }
        }
      }
    }

    // Sort candidates by score (highest first)
    this.candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate feedback based on bias values
   */
  private generateFeedback(bias: CarBias): Biasfeedback {
    return {
      oversteer: this.classifyBiasMetric(bias.oversteer),
      brakingStability: this.classifyBiasMetric(bias.brakingStability),
      cornering: this.classifyBiasMetric(bias.cornering),
      traction: this.classifyBiasMetric(bias.traction),
      straights: this.classifyBiasMetric(bias.straights)
    };
  }

  /**
   * Classify individual bias metric
   */
  private classifyBiasMetric(value: number): FeedbackType {
    // Assuming optimal range is around 0.4-0.6 for most metrics
    const distance = Math.abs(value - 0.5);
    
    if (distance <= 0.007) return FeedbackType.OPTIMAL;
    if (distance <= 0.04) return FeedbackType.GREAT;
    if (distance <= 0.1) return FeedbackType.GOOD;
    return FeedbackType.BAD;
  }

  /**
   * Calculate score for a setup (higher is better)
   */
  private calculateScore(setup: SetupParameters, bias: CarBias, confidence: number): number {
    let score = confidence; // Base score from confidence

    // Bonus for balanced setup (not too extreme)
    const setupValues = [
      setup.frontWingAngle,
      setup.rearWingAngle,
      setup.antiRollDistribution,
      setup.tyreCamber,
      setup.toeOut
    ];

    const balance = setupValues.reduce((sum, val) => sum + Math.abs(val - 0.5), 0) / setupValues.length;
    score += (0.5 - balance) * 20; // Bonus for balance

    // Penalty for extreme bias values
    const biasValues = [bias.oversteer, bias.brakingStability, bias.cornering, bias.traction, bias.straights];
    const extremeBias = biasValues.reduce((sum, val) => {
      if (val < 0 || val > 1) return sum + Math.abs(val < 0 ? val : val - 1) * 50;
      return sum;
    }, 0);
    
    score -= extremeBias;

    return Math.max(0, score);
  }

  /**
   * Record a practice attempt and narrow down candidates
   */
  recordAttempt(setup: SetupParameters, feedback: Biasfeedback): void {
    const bias = this.calculator.calculateBias(setup);
    const confidence = this.calculator.calculateConfidence(bias);

    this.attemptHistory.push({
      setup,
      feedback,
      confidence
    });

    // Filter candidates based on feedback constraints
    this.narrowCandidates(feedback);
  }

  /**
   * Narrow down candidates based on feedback
   */
  private narrowCandidates(feedback: Biasfeedback): void {
    this.candidates = this.candidates.filter(candidate => {
      return this.feedbackMatches(candidate.feedback, feedback);
    });

    // If we have too few candidates, regenerate with tighter constraints
    if (this.candidates.length < 5) {
      this.expandCandidatesAroundBest(feedback);
    }

    // Re-sort by score
    this.candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Expand candidates around the best performing setups
   */
  private expandCandidatesAroundBest(feedback: Biasfeedback): void {
    const topCandidates = this.candidates.slice(0, 3);
    const newCandidates: SetupCandidate[] = [];

    for (const candidate of topCandidates) {
      // Generate variations around this candidate
      const variations = this.generateVariations(candidate.setup, 0.1, 5);
      
      for (const variation of variations) {
        const bias = this.calculator.calculateBias(variation);
        const confidence = this.calculator.calculateConfidence(bias);
        const candidateFeedback = this.generateFeedback(bias);
        
        if (this.feedbackMatches(candidateFeedback, feedback)) {
          const score = this.calculateScore(variation, bias, confidence);
          
          newCandidates.push({
            setup: variation,
            bias,
            confidence,
            feedback: candidateFeedback,
            score
          });
        }
      }
    }

    this.candidates.push(...newCandidates);
  }

  /**
   * Generate setup variations around a base setup
   */
  private generateVariations(baseSetup: SetupParameters, range: number, count: number): SetupParameters[] {
    const variations: SetupParameters[] = [];

    for (let i = 0; i < count; i++) {
      const variation: SetupParameters = {
        frontWingAngle: this.clamp(baseSetup.frontWingAngle + (Math.random() - 0.5) * range, 0, 1),
        rearWingAngle: this.clamp(baseSetup.rearWingAngle + (Math.random() - 0.5) * range, 0, 1),
        antiRollDistribution: this.clamp(baseSetup.antiRollDistribution + (Math.random() - 0.5) * range, 0, 1),
        tyreCamber: this.clamp(baseSetup.tyreCamber + (Math.random() - 0.5) * range, 0, 1),
        toeOut: this.clamp(baseSetup.toeOut + (Math.random() - 0.5) * range, 0, 1)
      };

      variations.push(variation);
    }

    return variations;
  }

  /**
   * Check if two feedback objects are compatible
   */
  private feedbackMatches(calculated: Biasfeedback, expected: Biasfeedback): boolean {
    const metrics: (keyof Biasfeedback)[] = ['oversteer', 'brakingStability', 'cornering', 'traction', 'straights'];
    
    return metrics.every(metric => {
      return this.feedbackCompatible(calculated[metric], expected[metric]);
    });
  }

  /**
   * Check if individual feedback values are compatible
   */
  private feedbackCompatible(calculated: FeedbackType, expected: FeedbackType): boolean {
    const feedbackOrder = [FeedbackType.BAD, FeedbackType.GOOD, FeedbackType.GREAT, FeedbackType.OPTIMAL];
    const calcIndex = feedbackOrder.indexOf(calculated);
    const expIndex = feedbackOrder.indexOf(expected);
    
    // Allow feedback to be within 1 level of expected
    return Math.abs(calcIndex - expIndex) <= 1;
  }

  /**
   * Get the best recommendations based on current candidates
   */
  getBestRecommendations(count: number = 5): SetupParameters[] {
    return this.candidates
      .slice(0, count)
      .map(candidate => candidate.setup);
  }

  /**
   * Get optimization statistics
   */
  getStats(): {
    totalCandidates: number;
    attemptCount: number;
    bestConfidence: number;
    convergenceRate: number;
  } {
    const bestConfidence = this.candidates.length > 0 ? this.candidates[0].confidence : 0;
    const convergenceRate = this.calculateConvergenceRate();

    return {
      totalCandidates: this.candidates.length,
      attemptCount: this.attemptHistory.length,
      bestConfidence,
      convergenceRate
    };
  }

  /**
   * Calculate how quickly we're converging to optimal
   */
  private calculateConvergenceRate(): number {
    if (this.attemptHistory.length < 2) return 0;

    const confidences = this.attemptHistory.map(attempt => attempt.confidence);
    const improvements = [];

    for (let i = 1; i < confidences.length; i++) {
      improvements.push(confidences[i] - confidences[i - 1]);
    }

    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    return Math.max(0, avgImprovement);
  }

  /**
   * Reset the optimizer for a new session
   */
  reset(): void {
    this.attemptHistory = [];
    this.initializeCandidates();
  }

  /**
   * Utility function to clamp values between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Predict confidence for a given setup
   */
  predictConfidence(setup: SetupParameters): number {
    const bias = this.calculator.calculateBias(setup);
    return this.calculator.calculateConfidence(bias);
  }

  /**
   * Check if we've likely reached optimal setup
   */
  isOptimal(): boolean {
    if (this.candidates.length === 0) return false;
    
    const bestConfidence = this.candidates[0].confidence;
    return bestConfidence >= 99.0;
  }

  /**
   * Estimate how many more attempts needed to reach optimal
   */
  estimateAttemptsToOptimal(): number {
    const stats = this.getStats();
    
    if (stats.bestConfidence >= 99) return 0;
    if (stats.convergenceRate <= 0) return 5; // Default estimate
    
    const remaining = 99 - stats.bestConfidence;
    return Math.ceil(remaining / stats.convergenceRate);
  }
}