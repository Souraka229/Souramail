/**
 * BullMQ worker host. Phase 0: wiring + a no-op processor per queue so the process
 * boots and the queues exist. Real processors land in their phases:
 *   send            → Phase 1 (outbound pipeline, docs/05 §4.2)
 *   inbound-process → Phase 1 (inbound pipeline, docs/05 §4.1)
 *   ai-job          → Phase 2
 *   webhook-deliver → Phase 2
 *   warmup          → Phase 5
 */
import { QUEUES, type QueueName } from '@souramail/contracts';
import { type Job, Worker } from 'bullmq';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

const handlers: Record<QueueName, (job: Job) => Promise<unknown>> = {
  [QUEUES.send]: async (job) => job.log('send: not implemented (Phase 1)'),
  [QUEUES.inboundProcess]: async (job) => job.log('inbound-process: not implemented (Phase 1)'),
  [QUEUES.aiJob]: async (job) => job.log('ai-job: not implemented (Phase 2)'),
  [QUEUES.webhookDeliver]: async (job) => job.log('webhook-deliver: not implemented (Phase 2)'),
  [QUEUES.warmup]: async (job) => job.log('warmup: not implemented (Phase 5)'),
};

const workers = (Object.keys(handlers) as QueueName[]).map(
  (name) =>
    new Worker(name, (job) => handlers[name](job), {
      connection,
      concurrency: 5,
    }),
);

for (const w of workers) {
  w.on('ready', () => console.log(`▸ worker ready: ${w.name}`));
  w.on('failed', (job, err) => console.error(`✗ ${w.name}#${job?.id} failed:`, err.message));
}

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  });
}
