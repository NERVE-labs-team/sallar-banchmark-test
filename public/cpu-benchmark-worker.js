import { runCpuTest } from './benchmarks/cpu-points.js';

const cpuBenchmark = () => {
  try {
    console.log('Measure cpu points...');
    const { cpuPoints } = runCpuTest();
    console.log(`Measured ${cpuPoints} cpu points`);

    return { cpu_points: cpuPoints };
  } catch (err) {
    console.log(`Error occurred: ${err}`);

    return {};
  }
};

self.onmessage = async (e) => {
  console.log();
  self.postMessage(cpuBenchmark());
};
