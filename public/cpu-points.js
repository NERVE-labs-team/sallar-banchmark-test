const cpuHeavyComputation = (iterations) => {
  let total = 0;
  for (let i = 0; i < iterations; i++) {
    const x = Math.sin(i) * Math.cos(i) * Math.tan(i % 360);
    total += x * x + Math.sqrt(Math.abs(x));
  }
  return total;
};

const runTestCase = () => {
  const iterations = 10_000_000;
  const start = performance.now();
  cpuHeavyComputation(iterations);
  const end = performance.now();

  const durationMs = end - start;
  const points = Math.round(iterations / durationMs);

  return points;
};

export const runCpuTest = () => {
  const ITERATIONS = 20;
  let sum = 0;

  for (let i = 0; i < ITERATIONS; ++i) {
    const result = runTestCase();
    sum += result;
  }

  return Math.round(sum / ITERATIONS);
};
