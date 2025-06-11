import { runInternetSppedTest } from './internet-speed.js';

const program = new SallarNetworkClient.InstanceManager(io);

program.on('perform-benchmark', async ({ value }, manager) => {
  const internetSpeed = Math.round(await runInternetSppedTest());

  console.log(`Measured ${internetSpeed} Mb/s download speed`);

  // TODO: Perform actual benchmark
  manager.emit('benchmark-finished', {
    cpu_points: 1,
    gpu_points: 1,
    internet_speed: internetSpeed,
  });
});
