import { runInternetSppedTest } from './internet-speed.js';
import { runWebGpuTest } from './gpu-points.js';
import { runCpuTest } from './cpu-points.js';

const manager = new SallarNetworkClient.InstanceManager(io);

manager.emit('entity-token', {
  entity_token: window.location.href.split('#')[1].split(',')[2],
});

manager.on('perform-benchmark', async (_, manager) => {
  try {
    console.log('Measure internet speed...');
    const internetSpeed = await runInternetSppedTest();
    console.log(`Measured ${internetSpeed} Mb/s download speed`);

    console.log('Measure gpu points...');
    const { gpuPoints, gpuInfo } = await runWebGpuTest();
    console.log(`Measured ${gpuPoints} gpu points`);
    console.log(`Gpu model: ${JSON.stringify(gpuInfo, null, 2)}`);

    console.log('Measure cpu points...');
    const { cpuPoints } = runCpuTest();
    console.log(`Measured ${cpuPoints} cpu points`);

    console.log('Benchmark completed');

    manager.emit('benchmark-finished', {
      gpu_points: gpuPoints,
      gpu_info: gpuInfo ? `${gpuInfo.vendor} ${gpuInfo.renderer}` : null,
      cpu_points: cpuPoints,
      internet_speed: internetSpeed,
    });
  } catch (err) {
    console.log(`Error occurred: ${err}`);
    manager.socket.disconnect();
  }
});
