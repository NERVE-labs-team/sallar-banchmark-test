import { InstanceManager, MinimalEventPayload } from '@sallar-network/server';
import * as dotenv from 'dotenv';
import { BenchmarkData } from './types';
import { report_data_to_node_manager } from './requests';

// Emit command to start actual benchmark
export const on_worker_connected = (
  { worker_id }: MinimalEventPayload,
  manager: InstanceManager
) => {
  manager.emit('perform-benchmark', null, worker_id);
};

// Send benchmark data to node-manager
const handle_benchmark_data = async (
  data: BenchmarkData,
  manager: InstanceManager
) => {
  console.log(
    `${data.worker_id}: `,
    data.cpu_points,
    data.gpu_points,
    data.internet_speed
  );

  if (!manager.config.dev_mode) {
    console.log(`Report ${data.worker_id} worker benchmark data to database`);
    await report_data_to_node_manager(data, manager.config);
  }
};

// Log any errors
export const on_error = ({ worker_id }: MinimalEventPayload, err: any) => {
  console.log(`There is problem with worker "${worker_id}". Error: ${err}`);
};

(async () => {
  dotenv.config();

  const manager = new InstanceManager({
    public_path: `./public`,
    http_port: Number(process.env.PORT),
    dev_mode: process.env.DEV_MODE === 'true',
    node_manager_server: process.env.NODE_MANAGER_SERVER,
    program_token: process.env.PROGRAM_TOKEN,
  });

  manager.on('benchmark-finished', handle_benchmark_data);
  await manager.launch(on_worker_connected, on_error);
})();
