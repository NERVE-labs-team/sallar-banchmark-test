import {
  ErrorHandler,
  EventHandler,
  InstanceManager,
  MinimalEventPayload,
  WorkerDisconnectedException,
} from '@sallar-network/server';
import * as dotenv from 'dotenv';
import { BenchmarkData, EntityToken } from './types';
import {
  block_worker,
  report_data_to_node_manager,
  unblock_worker,
} from './requests';

let entity_token: string = '';

// Emit command to start actual benchmark
export const on_worker_connected: EventHandler<MinimalEventPayload> = async (
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
  console.log(`Bechmark finished. Result: ${JSON.stringify(data, null, 2)}`);

  console.log(`Report ${data.worker_id} worker benchmark data to database`);
  await report_data_to_node_manager(data, manager.config, entity_token);
  await unblock_worker(manager.config, entity_token);
};

// Log any errors
export const on_error: ErrorHandler = async (
  { worker_id }: MinimalEventPayload,
  err: any,
  manager
) => {
  if (err instanceof WorkerDisconnectedException) {
    console.log('Socket disconnected');

    await unblock_worker(manager.config, entity_token);

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

  manager.on('entity-token', async (data: EntityToken, manager) => {
    entity_token = data.entity_token;
    await block_worker(manager.config, entity_token);
  });

  manager.on('benchmark-finished', handle_benchmark_data);

  await manager.launch(on_worker_connected, on_error);
})();
