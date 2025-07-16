import {
  ErrorHandler,
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

let entity_tokens: Map<string, string> = new Map();

// Send benchmark data to node-manager
const handle_benchmark_data = async (
  data: BenchmarkData,
  manager: InstanceManager
) => {
  console.log(`Bechmark finished. Result: ${JSON.stringify(data, null, 2)}`);

  console.log(`Report ${data.worker_id} worker benchmark data to database`);
  const token = entity_tokens.get(data.worker_id)!;
  entity_tokens.delete(data.worker_id);
  await report_data_to_node_manager(data, manager.config, token);
  await unblock_worker(manager.config, token);
};

// Log any errors
export const on_error: ErrorHandler = async (
  { worker_id }: MinimalEventPayload,
  err: any,
  manager
) => {
  if (err instanceof WorkerDisconnectedException) {
    console.log(`Socket disconnected. Unblock worker ${worker_id}`);
    await unblock_worker(manager.config, entity_tokens.get(worker_id)!);
    entity_tokens.delete(worker_id);
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
    console.log(`Start benchmark for ${data.worker_id}`);

    entity_tokens.set(data.worker_id, data.entity_token);
    await block_worker(manager.config, entity_tokens.get(data.worker_id)!);
    manager.emit('perform-benchmark', null, data.worker_id);
  });

  manager.on('benchmark-finished', handle_benchmark_data);

  await manager.launch(({ worker_id }) => {
    console.log(`${worker_id} connected`);
  }, on_error);
})();
