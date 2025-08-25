import { block_worker, unblock_worker } from './requests.js';
import { runInternetSppedTest } from './benchmarks/internet-speed.js';
import { runWebGpuTest } from './benchmarks/gpu-points.js';

const mainBenchmark = async () => {
  try {
    console.log('Measure internet speed...');
    const internetSpeed = await runInternetSppedTest();
    console.log(`Measured ${internetSpeed} Mb/s download speed`);

    console.log('Measure gpu points...');
    const { gpuPoints, gpuInfo } = await runWebGpuTest();
    console.log(`Measured ${gpuPoints} gpu points`);
    console.log(`Gpu model: ${JSON.stringify(gpuInfo, null, 2)}`);

    return {
      gpu_points: gpuPoints,
      gpu_info: gpuInfo ? `${gpuInfo.vendor} ${gpuInfo.renderer}` : null,
      internet_speed: internetSpeed,
    };
  } catch (err) {
    console.log(`Error occurred: ${err}`);

    return {};
  }
};

(async () => {
  const entityToken = window.location.href.split('#')[1].split(',')[2];

  const manager = new SallarNetworkClient.InstanceManager(io);

  await block_worker(entityToken);
  console.log('Worker blocked');

  // Start worker

  const worker = new Worker('cpu-benchmark-worker.js', { type: 'module' });
  worker.postMessage('start');

  worker.onmessage = async (e) => {
    console.log('aaaa', JSON.stringify(e.data, null, 2));

    if (e.data) {
      const mainBenchmarkResult = await mainBenchmark();

      manager.emit('benchmark-finished', {
        ...e.data,
        ...mainBenchmarkResult,
        entity_token: entityToken,
      });
    }

    await unblock_worker(entityToken);
    console.log('Worker unblocked');
  };

  worker.onerror = async () => {
    await unblock_worker(entityToken);
    console.log('Worker unblocked');
  };
})();
