require('dotenv').config();
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const Watcher = require('./watcher');
const axios = require('axios');
const winston = require('winston');

// Logger Setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'agent.log' })
    ]
});

class LocalAgent {
    constructor() {
        this.watcher = new Watcher(config.dropboxRoot, logger);
        this.isProcessing = false;
    }

    async start() {
        logger.info('Starting AutoDesign Local Agent v3.2...');

        // Start watching Dropbox for Templates
        this.watcher.start();

        // Start Polling Loop for Jobs
        this.pollLoop();
    }

    async pollLoop() {
        setInterval(async () => {
            if (this.isProcessing) return;

            try {
                await this.checkForJobs();
            } catch (error) {
                logger.error('Error polling for jobs:', error.message);
            }
        }, config.pollIntervalMs);
    }

    async checkForJobs() {
        try {
            const response = await axios.get(`${config.apiBaseUrl}/jobs`);
            const jobs = response.data.jobs;

            if (jobs && jobs.length > 0) {
                logger.info(`Found ${jobs.length} pending jobs.`);
                // Process only one at a time for safety
                await this.processJob(jobs[0]);
            } else {
                logger.info('Polling... No pending jobs.');
            }
        } catch (error) {
            logger.error('Error polling API:', error.message);
        }
    }

    async processJob(job) {
        this.isProcessing = true;
        logger.info(`Starting Job Processing: ${job.id} (${job.template})`);

        try {
            // Define paths
            const templateDir = this.watcher.templates.get(job.template);
            if (!templateDir) {
                throw new Error(`Template not found locally: ${job.template}`);
            }

            const templatePath = path.join(templateDir, `${job.template}.psd`);
            const outputDir = path.join(path.dirname(config.dropboxRoot), 'OUTPUT', job.orderId); // Dropbox/OUTPUT/1001/

            // Initialize Photoshop Wrapper
            const Photoshop = require('./photoshop');
            const ps = new Photoshop(logger);

            // Execute Photoshop Script
            // We verify file existence first
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template PSD missing: ${templatePath}`);
            }

            const result = await ps.processJob(templatePath, job.data, outputDir);
            logger.info('Job completed successfully.');

            // Notify PWA
            await axios.post(`${config.apiBaseUrl}/jobs`, {
                jobId: job.id,
                status: 'completed',
                resultPath: outputDir
            });

        } catch (error) {
            logger.error(`Job Failed: ${error.message}`);
            // Notify PWA of error
            await axios.post(`${config.apiBaseUrl}/jobs`, {
                jobId: job.id,
                status: 'error',
                error: error.message
            });
        } finally {
            this.isProcessing = false;
        }
    }
}

const agent = new LocalAgent();
agent.start();
