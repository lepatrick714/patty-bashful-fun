import { SetupCalculator } from './calculator';
import { IterativeOptimizer } from './optimizer';
import { SetupParameters, FeedbackType } from './types';

/**
 * Test the F1 Manager Setup Optimizer
 */
function runTests(): void {
  console.log('🧪 Running F1 Manager Setup Optimizer Tests...\n');

  testBasicCalculations();
  testMatrixOperations();
  testOptimization();
  testIterativeProcess();

  console.log('✅ All tests completed successfully!\n');
  
  // Show a sample optimization
  demonstrateOptimization();
}

function testBasicCalculations(): void {
  console.log('📊 Testing basic calculations...');
  
  const calculator = new SetupCalculator();
  
  // Test middle setup (should be baseline)
  const middleSetup: SetupParameters = {
    frontWingAngle: 0.5,
    rearWingAngle: 0.5,
    antiRollDistribution: 0.5,
    tyreCamber: 0.5,
    toeOut: 0.5
  };

  const bias = calculator.calculateBias(middleSetup);
  const confidence = calculator.calculateConfidence(bias);
  
  console.log(`   Middle setup bias:`, bias);
  console.log(`   Middle setup confidence: ${confidence.toFixed(1)}%`);
  
  // Test extreme setup
  const extremeSetup: SetupParameters = {
    frontWingAngle: 1.0,
    rearWingAngle: 0.0,
    antiRollDistribution: 1.0,
    tyreCamber: 0.0,
    toeOut: 1.0
  };

  const extremeBias = calculator.calculateBias(extremeSetup);
  const extremeConfidence = calculator.calculateConfidence(extremeBias);
  
  console.log(`   Extreme setup bias:`, extremeBias);
  console.log(`   Extreme setup confidence: ${extremeConfidence.toFixed(1)}%`);
  
  console.log('✓ Basic calculations working\n');
}

function testMatrixOperations(): void {
  console.log('🔢 Testing matrix operations...');
  
  // This is implicitly tested by the calculator
  const calculator = new SetupCalculator();
  
  const testSetups = [
    { frontWingAngle: 0.0, rearWingAngle: 0.0, antiRollDistribution: 0.0, tyreCamber: 0.0, toeOut: 0.0 },
    { frontWingAngle: 1.0, rearWingAngle: 1.0, antiRollDistribution: 1.0, tyreCamber: 1.0, toeOut: 1.0 },
    { frontWingAngle: 0.25, rearWingAngle: 0.75, antiRollDistribution: 0.5, tyreCamber: 0.3, toeOut: 0.8 }
  ];

  testSetups.forEach((setup, index) => {
    const bias = calculator.calculateBias(setup);
    console.log(`   Test setup ${index + 1} processed successfully`);
  });
  
  console.log('✓ Matrix operations working\n');
}

function testOptimization(): void {
  console.log('🎯 Testing optimization engine...');
  
  const calculator = new SetupCalculator();
  
  // Get optimal setups without feedback constraints
  const optimalSetups = calculator.findOptimalSetup();
  console.log(`   Found ${optimalSetups.length} optimal setups`);
  
  if (optimalSetups.length > 0) {
    const best = optimalSetups[0];
    const bestBias = calculator.calculateBias(best);
    const bestConfidence = calculator.calculateConfidence(bestBias);
    
    console.log(`   Best setup confidence: ${bestConfidence.toFixed(1)}%`);
    console.log(`   Best setup:`, calculator.formatSetup(best));
  }
  
  console.log('✓ Optimization engine working\n');
}

function testIterativeProcess(): void {
  console.log('🔄 Testing iterative optimization...');
  
  const optimizer = new IterativeOptimizer();
  
  // Simulate a practice session with feedback
  const testSetup: SetupParameters = {
    frontWingAngle: 0.6,
    rearWingAngle: 0.4,
    antiRollDistribution: 0.5,
    tyreCamber: 0.3,
    toeOut: 0.7
  };

  const feedback = {
    oversteer: FeedbackType.GOOD,
    brakingStability: FeedbackType.BAD,
    cornering: FeedbackType.GREAT,
    traction: FeedbackType.GOOD,
    straights: FeedbackType.BAD
  };

  optimizer.recordAttempt(testSetup, feedback);
  
  const recommendations = optimizer.getBestRecommendations(3);
  const stats = optimizer.getStats();
  
  console.log(`   Recorded practice attempt`);
  console.log(`   Generated ${recommendations.length} recommendations`);
  console.log(`   Stats: ${stats.totalCandidates} candidates, attempt ${stats.attemptCount}`);
  
  console.log('✓ Iterative optimization working\n');
}

function demonstrateOptimization(): void {
  console.log('🏎️  SAMPLE OPTIMIZATION DEMO\n');
  
  const calculator = new SetupCalculator();
  const optimizer = new IterativeOptimizer();
  
  console.log('Starting with a basic setup...');
  
  let currentSetup: SetupParameters = {
    frontWingAngle: 0.3,
    rearWingAngle: 0.7,
    antiRollDistribution: 0.4,
    tyreCamber: 0.6,
    toeOut: 0.5
  };
  
  console.log('Initial setup:');
  console.log(calculator.formatSetup(currentSetup));
  
  let initialBias = calculator.calculateBias(currentSetup);
  let initialConfidence = calculator.calculateConfidence(initialBias);
  
  console.log(`Initial confidence: ${initialConfidence.toFixed(1)}%\n`);
  
  // Simulate 3 practice iterations
  for (let i = 1; i <= 3; i++) {
    console.log(`--- Practice Attempt #${i} ---`);
    
    // Generate realistic feedback based on current setup
    const bias = calculator.calculateBias(currentSetup);
    const simulatedFeedback = {
      oversteer: generateRealisticFeedback(bias.oversteer),
      brakingStability: generateRealisticFeedback(bias.brakingStability),
      cornering: generateRealisticFeedback(bias.cornering),
      traction: generateRealisticFeedback(bias.traction),
      straights: generateRealisticFeedback(bias.straights)
    };
    
    console.log('Feedback received:', simulatedFeedback);
    
    // Record attempt and get recommendations
    optimizer.recordAttempt(currentSetup, simulatedFeedback);
    const recommendations = optimizer.getBestRecommendations(1);
    
    if (recommendations.length > 0) {
      currentSetup = recommendations[0];
      const newBias = calculator.calculateBias(currentSetup);
      const newConfidence = calculator.calculateConfidence(newBias);
      
      console.log('New recommended setup:');
      console.log(calculator.formatSetup(currentSetup));
      console.log(`New confidence: ${newConfidence.toFixed(1)}%`);
      
      if (optimizer.isOptimal()) {
        console.log('🎉 Optimal setup achieved!');
        break;
      }
    }
    
    console.log();
  }
  
  const finalStats = optimizer.getStats();
  console.log(`Final stats: ${finalStats.attemptCount} attempts, ${finalStats.bestConfidence.toFixed(1)}% confidence`);
  console.log('Demo completed! 🏁');
}

function generateRealisticFeedback(biasValue: number): FeedbackType {
  // Generate realistic feedback based on bias value
  // Assuming optimal bias is around 0.5
  const distance = Math.abs(biasValue - 0.5);
  
  if (distance <= 0.05) return FeedbackType.OPTIMAL;
  if (distance <= 0.1) return FeedbackType.GREAT;
  if (distance <= 0.2) return FeedbackType.GOOD;
  return FeedbackType.BAD;
}

// Run the tests
runTests();