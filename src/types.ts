import { MinimalEventPayload } from '@sallar-network/server';

export interface BenchmarkData extends MinimalEventPayload {
  cpu_points: number;
  gpu_points: number;
  internet_speed: number;
}
