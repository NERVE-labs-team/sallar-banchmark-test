const cpuHeavyComputation = (iterations) => {
  let total = 0;
  console.log('Run cpu heavy operation');
  for (let i = 0; i < iterations; i++) {
    const x = Math.sin(i) * Math.cos(i) * Math.tan(i % 360);
    total += x * x + Math.sqrt(Math.abs(x));
  }
  console.log('End cpu heavy operation');

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
  try {
    const ITERATIONS = 20;
    let sum = 0;

    for (let i = 0; i < ITERATIONS; ++i) {
      console.log(`Cpu test #${i}`);
      const result = runTestCase();
      sum += result;
    }

    return { cpuPoints: Math.round(sum / ITERATIONS) };
  } catch {
    return { cpuPoints: 0 };
  }
};
