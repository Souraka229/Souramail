/**
 * BullMQ worker host.
 *   send            → Phase 1 outbound pipeline (processors/send.ts, docs/05 §4.2)
 *   inbound-process → Phase 1 inbound pipeline  (processors/inbound.ts, docs/05 §4.1)
 *   ai-job          → Phase 2
 *   webhook-deliver → Phase 2
 *   warmup          → Phase 5
 */
import { QUEUES, type QueueName } from '@souramail/contracts';
import { type Job, Worker } from 'bullmq';
import { processInbound } from './processors/inbound.ts';
import { processSend } from './processors/send.ts';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

const handlers: Record<QueueName, (job: Job) => Promise<unknown>> = {
  [QUEUES.send]: processSend,
  [QUEUES.inboundProcess]: processInbound,
  [QUEUES.aiJob]: async (job) => job.log('ai-job: not implemented (Phase 2)'),
  [QUEUES.webhookDeliver]: async (job) => job.log('webhook-deliver: not implemented (Phase 2)'),
  [QUEUES.warmup]: async (job) => job.log('warmup: not implemented (Phase 5)'),
};

const workers = (Object.keys(handlers) as QueueName[]).map(
  (name) =>
    new Worker(name, (job) => handlers[name](job), {
      connection,
      concurrency: name === QUEUES.send ? 10 : 5,
    }),
);

for (const w of workers) {
  w.on('ready', () => console.log(`▸ worker ready: ${w.name}`));
  w.on('completed', (job) => console.log(`✓ ${w.name}#${job.id} done`));
  w.on('failed', (job, err) => console.error(`✗ ${w.name}#${job?.id} failed:`, err.message));
}

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  });
}
