const runTestCase = async () => {
  if (!navigator.gpu) {
    console.log('WebGPU not supported');
    return 0;
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  const shaderCode = `
          @compute @workgroup_size(64)
          fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            let index = global_id.x;
            for (var i = 0u; i < 1000u; i++) {
              // Fake heavy computation
              let x = f32(index) * 1.01;
              let y = x * x * 0.0001;
            }
          }
        `;

  const shaderModule = device.createShaderModule({ code: shaderCode });
  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: shaderModule, entryPoint: 'main' },
  });

  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(pipeline);
  passEncoder.dispatchWorkgroups(1000000 / 64);
  passEncoder.end();

  const start = performance.now();
  device.queue.submit([commandEncoder.finish()]);
  await device.queue.onSubmittedWorkDone();
  const end = performance.now();

  const durationMs = end - start;
  const points = Math.round(1_000_000 / durationMs);

  return points;
};

export const runWebGpuTest = async () => {
  const ITERATIONS = 20;
  let sum = 0;

  for (let i = 0; i < ITERATIONS; ++i) {
    const result = await runTestCase();
    sum += result;
  }

  return Math.round(sum / ITERATIONS);
};
