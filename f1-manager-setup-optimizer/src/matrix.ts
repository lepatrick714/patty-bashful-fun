/**
 * Simple matrix implementation for F1 Manager setup calculations
 */
export class SimpleMatrix {
  private data: number[][];
  public rows: number;
  public columns: number;

  constructor(data: number[][]) {
    this.data = data;
    this.rows = data.length;
    this.columns = data[0]?.length || 0;
  }

  /**
   * Get a specific row from the matrix
   */
  getRow(index: number): number[] {
    return [...this.data[index]];
  }

  /**
   * Get a specific column from the matrix
   */
  getColumn(index: number): number[] {
    return this.data.map(row => row[index]);
  }

  /**
   * Matrix subtraction
   */
  sub(other: SimpleMatrix): SimpleMatrix {
    if (this.rows !== other.rows || this.columns !== other.columns) {
      throw new Error('Matrix dimensions must match for subtraction');
    }

    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < this.columns; j++) {
        result[i][j] = this.data[i][j] - other.data[i][j];
      }
    }

    return new SimpleMatrix(result);
  }

  /**
   * Matrix multiplication
   */
  mmul(other: SimpleMatrix): SimpleMatrix {
    if (this.columns !== other.rows) {
      throw new Error('Invalid matrix dimensions for multiplication');
    }

    const result: number[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < other.columns; j++) {
        let sum = 0;
        for (let k = 0; k < this.columns; k++) {
          sum += this.data[i][k] * other.data[k][j];
        }
        result[i][j] = sum;
      }
    }

    return new SimpleMatrix(result);
  }

  /**
   * Matrix transpose
   */
  transpose(): SimpleMatrix {
    const result: number[][] = [];
    for (let j = 0; j < this.columns; j++) {
      result[j] = [];
      for (let i = 0; i < this.rows; i++) {
        result[j][i] = this.data[i][j];
      }
    }

    return new SimpleMatrix(result);
  }

  /**
   * Convert matrix to string for debugging
   */
  toString(): string {
    return this.data.map(row => row.join(', ')).join('\n');
  }
}