import { QUEUES } from '@souramail/contracts';
import { Queue } from 'bullmq';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

/** Producer-side queue handles. The worker (`apps/worker`) consumes them. */
export const inboundQueue = new Queue(QUEUES.inboundProcess, { connection });
export const sendQueue = new Queue(QUEUES.send, { connection });

export async function closeQueues(): Promise<void> {
  await Promise.all([inboundQueue.close(), sendQueue.close()]);
}
