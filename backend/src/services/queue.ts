/**
 * Simple in-memory job queue for email sending
 * Respects rate limits and provides throttling
 */

import PQueue from 'p-queue';
import { config } from '../config.js';

export interface QueuedJob<T = unknown> {
    id: string;
    type: string;
    payload: T;
    scheduledAt: Date;
    attempts: number;
    maxAttempts: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: unknown;
    error?: string;
}

type JobHandler<T> = (payload: T) => Promise<unknown>;

class JobQueue {
    private queue: PQueue;
    private handlers: Map<string, JobHandler<unknown>> = new Map();
    private jobs: Map<string, QueuedJob> = new Map();
    private hourlyCount = 0;
    private dailyCount = 0;
    private lastHourReset: Date = new Date();
    private lastDayReset: Date = new Date();

    constructor() {
        // Configure queue with rate limiting
        this.queue = new PQueue({
            concurrency: 1, // One at a time for email safety
            interval: config.delayBetweenEmailsMs,
            intervalCap: 1,
        });

        // Reset counters periodically
        setInterval(() => this.resetHourlyCount(), 60 * 60 * 1000); // Every hour
        setInterval(() => this.resetDailyCount(), 24 * 60 * 60 * 1000); // Every day
    }

    private resetHourlyCount(): void {
        this.hourlyCount = 0;
        this.lastHourReset = new Date();
    }

    private resetDailyCount(): void {
        this.dailyCount = 0;
        this.lastDayReset = new Date();
    }

    /**
     * Register a job handler
     */
    registerHandler<T>(type: string, handler: JobHandler<T>): void {
        this.handlers.set(type, handler as JobHandler<unknown>);
    }

    /**
     * Add a job to the queue
     */
    async addJob<T>(
        id: string,
        type: string,
        payload: T,
        options: {
            scheduledAt?: Date;
            maxAttempts?: number;
        } = {}
    ): Promise<void> {
        const job: QueuedJob<T> = {
            id,
            type,
            payload,
            scheduledAt: options.scheduledAt || new Date(),
            attempts: 0,
            maxAttempts: options.maxAttempts || 3,
            status: 'pending',
        };

        this.jobs.set(id, job as QueuedJob);

        // Schedule the job
        const delay = Math.max(0, job.scheduledAt.getTime() - Date.now());

        setTimeout(() => {
            this.queue.add(() => this.processJob(id));
        }, delay);
    }

    /**
     * Process a job
     */
    private async processJob(id: string): Promise<void> {
        const job = this.jobs.get(id);
        if (!job) return;

        // Check rate limits for email jobs
        if (job.type === 'send_email') {
            if (this.hourlyCount >= config.maxEmailsPerHour) {
                console.log(`Rate limit reached: ${this.hourlyCount}/${config.maxEmailsPerHour} per hour`);
                // Reschedule for next hour
                setTimeout(() => {
                    this.queue.add(() => this.processJob(id));
                }, 60 * 60 * 1000);
                return;
            }

            if (this.dailyCount >= config.maxEmailsPerDay) {
                console.log(`Daily limit reached: ${this.dailyCount}/${config.maxEmailsPerDay} per day`);
                job.status = 'failed';
                job.error = 'Daily email limit reached';
                return;
            }
        }

        const handler = this.handlers.get(job.type);
        if (!handler) {
            job.status = 'failed';
            job.error = `No handler for job type: ${job.type}`;
            return;
        }

        job.status = 'running';
        job.attempts++;

        try {
            job.result = await handler(job.payload);
            job.status = 'completed';

            // Increment counters for email jobs
            if (job.type === 'send_email') {
                this.hourlyCount++;
                this.dailyCount++;
            }
        } catch (error: any) {
            job.error = error.message || 'Unknown error';

            if (job.attempts < job.maxAttempts) {
                job.status = 'pending';
                // Exponential backoff
                const delay = Math.pow(2, job.attempts) * 1000;
                setTimeout(() => {
                    this.queue.add(() => this.processJob(id));
                }, delay);
            } else {
                job.status = 'failed';
            }
        }
    }

    /**
     * Get job status
     */
    getJob(id: string): QueuedJob | undefined {
        return this.jobs.get(id);
    }

    /**
     * Get all jobs
     */
    getAllJobs(): QueuedJob[] {
        return Array.from(this.jobs.values());
    }

    /**
     * Get queue statistics
     */
    getStats(): {
        pending: number;
        running: number;
        completed: number;
        failed: number;
        hourlyCount: number;
        dailyCount: number;
        hourlyLimit: number;
        dailyLimit: number;
    } {
        const jobs = this.getAllJobs();
        return {
            pending: jobs.filter(j => j.status === 'pending').length,
            running: jobs.filter(j => j.status === 'running').length,
            completed: jobs.filter(j => j.status === 'completed').length,
            failed: jobs.filter(j => j.status === 'failed').length,
            hourlyCount: this.hourlyCount,
            dailyCount: this.dailyCount,
            hourlyLimit: config.maxEmailsPerHour,
            dailyLimit: config.maxEmailsPerDay,
        };
    }

    /**
     * Clear completed jobs
     */
    clearCompleted(): void {
        for (const [id, job] of this.jobs) {
            if (job.status === 'completed') {
                this.jobs.delete(id);
            }
        }
    }

    /**
     * Cancel a pending job
     */
    cancelJob(id: string): boolean {
        const job = this.jobs.get(id);
        if (job && job.status === 'pending') {
            this.jobs.delete(id);
            return true;
        }
        return false;
    }
}

// Singleton instance
export const jobQueue = new JobQueue();
