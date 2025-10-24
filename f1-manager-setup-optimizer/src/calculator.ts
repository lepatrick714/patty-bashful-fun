import { SimpleMatrix as Matrix } from './matrix';
import { CarBias, SetupParameters, FeedbackType, Biasfeedback } from './types';

/**
 * F1 Manager Setup Calculator
 * 
 * Based on the mathematical analysis from the F1 Manager community:
 * - Linear relationship between setup parameters and car bias
 * - Matrix operations for optimization
 * - Iterative refinement based on practice feedback
 */
export class SetupCalculator {
  // Coefficient matrix from research data
  // Each row represents a bias metric: [oversteer, braking, cornering, traction, straights]
  // Each column represents a setup parameter: [frontWing, rearWing, antiRoll, camber, toeOut]
  private readonly coefficientMatrix = new Matrix([
    [0.4, -0.4, -0.1, 0.1, 0.2],      // Oversteer
    [-0.2, 0.2, 0.15, -0.25, -0.05],  // Braking Stability  
    [0.3, 0.25, -0.15, 0.25, 0],      // Cornering
    [-0.15, 0.25, 0.5, -0.1, 0],      // Traction
    [-0.1, -0.9, 0, 0, 0]             // Straights
  ]);

  // Initial bias values when all setups are at middle position (0.5)
  private readonly initialBias: CarBias = {
    oversteer: 0.5,
    brakingStability: 0.45,
    cornering: 0.2,
    traction: 0.25,
    straights: 1.0
  };

  // Tolerance thresholds for feedback classification
  private readonly tolerances = {
    optimal: 0.007,
    great: 0.04,
    good: 0.1
  };

  /**
   * Calculate car bias from setup parameters
   */
  calculateBias(setup: SetupParameters): CarBias {
    // Convert setup to array format
    const setupArray = [
      setup.frontWingAngle,
      setup.rearWingAngle, 
      setup.antiRollDistribution,
      setup.tyreCamber,
      setup.toeOut
    ];

    // Calculate bias using matrix multiplication: bias = initial + coefficients * (setup - 0.5)
    const setupVector = new Matrix([setupArray]);
    const middleSetup = new Matrix([[0.5, 0.5, 0.5, 0.5, 0.5]]);
    const setupDiff = setupVector.sub(middleSetup);
    
    // Multiply by coefficient matrix (transposed since we need column operations)
    const biasChanges = setupDiff.mmul(this.coefficientMatrix.transpose());
    const biasArray = biasChanges.getRow(0);

    return {
      oversteer: this.initialBias.oversteer + biasArray[0],
      brakingStability: this.initialBias.brakingStability + biasArray[1],
      cornering: this.initialBias.cornering + biasArray[2],
      traction: this.initialBias.traction + biasArray[3],
      straights: this.initialBias.straights + biasArray[4]
    };
  }

  /**
   * Calculate confidence percentage based on bias values
   */
  calculateConfidence(bias: CarBias): number {
    let totalConfidence = 100;

    // For each bias metric, subtract confidence based on distance from optimal range
    const biasValues = [bias.oversteer, bias.brakingStability, bias.cornering, bias.traction, bias.straights];
    
    for (const value of biasValues) {
      // Assume optimal range is around 0.5 for each metric
      const distance = Math.abs(value - 0.5);
      
      if (distance > this.tolerances.optimal) {
        // Subtract 1% for each 0.01 difference, capped at 20%
        const penalty = Math.min(distance * 100, 20);
        totalConfidence -= penalty;
      }
    }

    return Math.max(0, totalConfidence);
  }

  /**
   * Classify feedback based on bias distance from optimal
   */
  classifyFeedback(bias: CarBias): FeedbackType {
    // Calculate average distance from optimal (assuming optimal is around 0.5 for each)
    const distances = [
      Math.abs(bias.oversteer - 0.5),
      Math.abs(bias.brakingStability - 0.5), 
      Math.abs(bias.cornering - 0.5),
      Math.abs(bias.traction - 0.5),
      Math.abs(bias.straights - 0.5)
    ];
    
    const avgDistance = distances.reduce((a, b) => a + b) / distances.length;

    if (avgDistance <= this.tolerances.optimal) return FeedbackType.OPTIMAL;
    if (avgDistance <= this.tolerances.great) return FeedbackType.GREAT;
    if (avgDistance <= this.tolerances.good) return FeedbackType.GOOD;
    return FeedbackType.BAD;
  }

  /**
   * Generate all possible setup combinations (brute force optimization)
   */
  generateAllCombinations(): SetupParameters[] {
    const combinations: SetupParameters[] = [];
    const steps = 20; // 20 steps for each parameter (0.0, 0.05, 0.10, ..., 1.0)
    
    for (let fw = 0; fw <= steps; fw++) {
      for (let rw = 0; rw <= steps; rw++) {
        for (let ar = 0; ar <= steps; ar++) {
          for (let tc = 0; tc <= steps; tc++) {
            for (let to = 0; to <= steps; to++) {
              combinations.push({
                frontWingAngle: fw / steps,
                rearWingAngle: rw / steps,
                antiRollDistribution: ar / steps,
                tyreCamber: tc / steps,
                toeOut: to / steps
              });
            }
          }
        }
      }
    }
    
    return combinations;
  }

  /**
   * Find optimal setup based on target bias or feedback constraints
   */
  findOptimalSetup(feedback?: Biasfeedback): SetupParameters[] {
    const allCombinations = this.generateAllCombinations();
    const validSetups: Array<{setup: SetupParameters, confidence: number}> = [];

    for (const setup of allCombinations) {
      const bias = this.calculateBias(setup);
      const confidence = this.calculateConfidence(bias);
      
      // If feedback is provided, filter based on feedback constraints
      if (feedback) {
        const setupFeedback = {
          oversteer: this.classifyFeedback({...bias, brakingStability: 0.5, cornering: 0.5, traction: 0.5, straights: 0.5}),
          brakingStability: this.classifyFeedback({oversteer: 0.5, brakingStability: bias.brakingStability, cornering: 0.5, traction: 0.5, straights: 0.5}),
          cornering: this.classifyFeedback({oversteer: 0.5, brakingStability: 0.5, cornering: bias.cornering, traction: 0.5, straights: 0.5}),
          traction: this.classifyFeedback({oversteer: 0.5, brakingStability: 0.5, cornering: 0.5, traction: bias.traction, straights: 0.5}),
          straights: this.classifyFeedback({oversteer: 0.5, brakingStability: 0.5, cornering: 0.5, traction: 0.5, straights: bias.straights})
        };

        // Only include setups that match the feedback constraints
        const matchesFeedback = (
          this.feedbackMatches(setupFeedback.oversteer, feedback.oversteer) &&
          this.feedbackMatches(setupFeedback.brakingStability, feedback.brakingStability) &&
          this.feedbackMatches(setupFeedback.cornering, feedback.cornering) &&
          this.feedbackMatches(setupFeedback.traction, feedback.traction) &&
          this.feedbackMatches(setupFeedback.straights, feedback.straights)
        );

        if (matchesFeedback) {
          validSetups.push({ setup, confidence });
        }
      } else {
        // If no feedback constraints, include all setups
        validSetups.push({ setup, confidence });
      }
    }

    // Sort by confidence (highest first) and return top setups
    validSetups.sort((a, b) => b.confidence - a.confidence);
    return validSetups.slice(0, 10).map(item => item.setup);
  }

  /**
   * Check if calculated feedback matches expected feedback
   */
  private feedbackMatches(calculated: FeedbackType, expected: FeedbackType): boolean {
    // Allow some tolerance in feedback matching
    const feedbackOrder = [FeedbackType.BAD, FeedbackType.GOOD, FeedbackType.GREAT, FeedbackType.OPTIMAL];
    const calcIndex = feedbackOrder.indexOf(calculated);
    const expIndex = feedbackOrder.indexOf(expected);
    
    // Allow feedback to be within 1 level of expected
    return Math.abs(calcIndex - expIndex) <= 1;
  }

  /**
   * Convert setup parameters to display format (percentages)
   */
  formatSetup(setup: SetupParameters): Record<string, string> {
    return {
      'Front Wing': `${Math.round(setup.frontWingAngle * 100)}%`,
      'Rear Wing': `${Math.round(setup.rearWingAngle * 100)}%`,
      'Anti-Roll': `${Math.round(setup.antiRollDistribution * 100)}%`,
      'Tyre Camber': `${Math.round(setup.tyreCamber * 100)}%`,
      'Toe-Out': `${Math.round(setup.toeOut * 100)}%`
    };
  }
}