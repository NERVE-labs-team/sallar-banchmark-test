import {
  ErrorHandler,
  InstanceManager,
  MinimalEventPayload,
  WorkerDisconnectedException,
} from '@sallar-network/server';
import * as dotenv from 'dotenv';
import { BenchmarkData } from './types';
import { report_data_to_node_manager } from './requests';

// Send benchmark data to node-manager
const handle_benchmark_data = async (
  data: BenchmarkData,
  manager: InstanceManager
) => {
  console.log(`Bechmark finished. Result: ${JSON.stringify(data, null, 2)}`);
  console.log(`Report ${data.worker_id} worker benchmark data to database`);

  await report_data_to_node_manager(data, manager.config, data.entity_token);
};

// Log any errors
export const on_error: ErrorHandler = async (
  { worker_id }: MinimalEventPayload,
  err: any
) => {
  if (err instanceof WorkerDisconnectedException) {
    console.log(`Socket disconnected for worker ${worker_id}`);
    return;
  }

  console.log(`There is problem with worker "${worker_id}". Error: ${err}`);
};

(async () => {
  dotenv.config();

  const manager = new InstanceManager({
    public_path: `./public`,
    http_port: Number(process.env.PORT),
    dev_mode: true,
    node_manager_server: process.env.NODE_MANAGER_SERVER,
  });

  manager.on('benchmark-finished', handle_benchmark_data);

  await manager.launch(({ worker_id }) => {
    console.log(`Worker ${worker_id} connected`);
  }, on_error);
})();
