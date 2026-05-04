import { createClient } from 'redis';
import { Queue, QueueEvents } from 'bullmq';
import { env } from './env.js';

export const redisClient = createClient({
  url: env.redisUrl
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err.message);
});

await redisClient.connect();

const connection = {
  host: new URL(env.redisUrl).hostname,
  port: Number(new URL(env.redisUrl).port || 6379)
};

export const jobsQueue = new Queue('lims-jobs', { connection });
export const jobsEvents = new QueueEvents('lims-jobs', { connection });
