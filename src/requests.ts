import { ManagerConfig } from '@sallar-network/server';
import axios from 'axios';
import { BenchmarkData } from './types';

export const report_data_to_node_manager = async (
  data: BenchmarkData,
  config: ManagerConfig,
  entity_token: string
) => {
  try {
    await axios.post(
      `${config.node_manager_server}/worker/benchmark?api_key=${process.env.NODE_MANAGER_API_KEY}`,
      { ...data, entity_token }
    );
  } catch (err) {
    console.log(`Cannot post benchmark data. Reason: ${err}`);
  }
};
