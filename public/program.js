import { runInternetSppedTest } from './internet-speed.js';
import { runWebGpuTest } from './gpu-points.js';
import { runCpuTest } from './cpu-points.js';
import { block_worker, unblock_worker } from './requests.js';

(async () => {
  const entityToken = window.location.href.split('#')[1].split(',')[2];

  try {
    const manager = new SallarNetworkClient.InstanceManager(io);

    await block_worker(entityToken);
    console.log('Worker blocked');

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
      entity_token: entityToken,
    });
  } catch (err) {
    console.log(`Error occurred: ${err}`);
  }

  await unblock_worker(entityToken);
  console.log('Worker unblocked');
})();
