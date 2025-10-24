/**
 * Represents the different types of feedback from practice sessions
 */
export enum FeedbackType {
  OPTIMAL = 'optimal',
  GREAT = 'great', 
  GOOD = 'good',
  BAD = 'bad'
}

/**
 * Represents the five car bias metrics
 */
export interface CarBias {
  oversteer: number;
  brakingStability: number;
  cornering: number;
  traction: number;
  straights: number;
}

/**
 * Represents the five setup parameters
 */
export interface SetupParameters {
  frontWingAngle: number;      // 0.0 to 1.0 (normalized)
  rearWingAngle: number;       // 0.0 to 1.0 (normalized)
  antiRollDistribution: number; // 0.0 to 1.0 (normalized)
  tyreCamber: number;          // 0.0 to 1.0 (normalized)
  toeOut: number;              // 0.0 to 1.0 (normalized)
}

/**
 * Represents feedback for each bias metric
 */
export interface Biasfeedback {
  oversteer: FeedbackType;
  brakingStability: FeedbackType;
  cornering: FeedbackType;
  traction: FeedbackType;
  straights: FeedbackType;
}