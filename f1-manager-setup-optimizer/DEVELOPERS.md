# F1 Manager Setup Optimizer

A TypeScript command-line tool to optimize car setups in F1 Manager games using mathematical analysis of the setup mechanics.

## How it works

This tool implements the same mathematical approach used by online F1 Manager setup calculators:

1. **Linear Relationship**: Car setup parameters have a linear relationship with bias values (Oversteer, Braking Stability, Cornering, Traction, Straights)
2. **Matrix Operations**: Uses linear algebra to calculate optimal setups based on feedback
3. **Iterative Refinement**: Narrows down to perfect setups in 3-5 practice attempts

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npm run dev
# or after building:
npm start
```

The tool will guide you through:
1. Setting your current practice setup
2. Running practice sessions and providing feedback
3. Getting optimized setup suggestions
4. Iterating until you achieve 99-100% confidence

## Setup Parameters

- **Front Wing Angle**: Affects oversteer (+), cornering (+), traction (-), straights (-)
- **Rear Wing Angle**: Affects oversteer (-), braking stability (+), cornering (+), traction (+), straights (-)
- **Anti-Roll Distribution**: Affects oversteer (-), braking stability (+), cornering (-), traction (+)
- **Tyre Camber**: Affects oversteer (+), braking stability (-), cornering (+), traction (-)
- **Toe-Out**: Affects oversteer (+), braking stability (-), traction (+)

## Feedback Types

- **Optimal**: Perfect setup (99-100% confidence)
- **Great**: Very good setup (96-98% confidence)  
- **Good**: Decent setup (90-95% confidence)
- **Bad**: Poor setup (<90% confidence)

## Credits

Based on the mathematical analysis by 1/6billionth and the research behind f1setup.it