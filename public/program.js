const program = new SallarNetworkClient.InstanceManager(io);

program.on('perform-benchmark', async ({ value }, manager) => {
  // TODO: Perform actual benchmark
  manager.emit('benchmark-finished', {
    cpu_points: 1,
    gpu_points: 1,
    internet_speed: 1, // Mb/s
  });
});
