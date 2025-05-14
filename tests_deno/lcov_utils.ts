// Utility functions to demonstrate coverage reporting

/**
 * Adds two numbers together
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Multiplies two numbers with conditional branch
 * to test coverage reports
 */
export function multiply(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }
  return a * b;
}

/**
 * Divides two numbers with error handling
 */
export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}
