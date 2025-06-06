import { ManagerConfig } from '@sallar-network/server';
import axios from 'axios';
import { BenchmarkData } from './types';

export const report_data_to_program_manager = async (
  data: BenchmarkData,
  config: ManagerConfig
) => {
  try {
    await axios.post(
      `${config.node_manager_server}/worker/benchmark/${data.worker_id}?api_key=${process.env.NODE_MANAGER_API_KEY}`,
      data
    );
  } catch (err) {
    throw new Error(`Cannot post benchmark data. Reason: ${err}`);
  }
};
