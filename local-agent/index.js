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
        logger.info('Starting AutoDesign Local Agent v3.5...');

        // 1. Initial Settings Fetch
        await this.updateSettings();

        // 2. Start watching Dropbox for Templates
        this.watcher.start();

        // 3. Start Polling Loop for Jobs
        this.pollLoop();
    }

    async updateSettings() {
        try {
            const res = await axios.get(`${config.apiBaseUrl}/settings`);
            this.settings = res.data;
            logger.info('Settings updated from PWA.');
        } catch (e) {
            logger.error('Failed to fetch settings:', e.message);
            this.settings = this.settings || {};
        }
    }

    async pollLoop() {
        setInterval(async () => {
            if (this.isProcessing) return;

            try {
                // Refresh settings occasionally (every 5 mins)
                if (Date.now() % 300000 < 10000) await this.updateSettings();
                await this.checkForJobs();
            } catch (error) {
                logger.error('Error polling for jobs:', error.message);
            }
        }, config.pollIntervalMs);
    }

    async checkForJobs() {
        try {
            const response = await axios.get(`${config.apiBaseUrl}/jobs`, {
                headers: { 'Authorization': `Bearer ${process.env.AGENT_SECRET_TOKEN || 'default_secret'}` }
            });
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
        logger.info(`Starting Job Processing: ${job.id} (Type: ${job.type})`);

        try {
            if (job.type === 'PHOTOSHOP_OPEN') {
                const payload = JSON.parse(job.payload);
                const Photoshop = require('./photoshop');
                const ps = new Photoshop(logger);

                let templateDir = this.watcher.templates.get(job.template_key);
                if (!templateDir && process.env.ENABLE_SIMULATION === 'true') {
                    templateDir = path.join(config.dropboxRoot, job.template_key);
                }

                if (!templateDir) {
                    throw new Error(`Template not found: ${job.template_key}`);
                }

                const templatePath = path.join(templateDir, `${job.template_key}.psd`);
                logger.info(`Opening for manual edit: ${templatePath}`);

                await ps.openInPhotoshop(templatePath, {
                    layers: payload.ai_data,
                    mappings: payload.mappings || {}
                });

                await axios.post(`${config.apiBaseUrl}/jobs`, {
                    jobId: job.id,
                    type: job.type,
                    status: 'completed'
                });
                return;
            }

            if (job.type === 'PHOTOSHOP_PREVIEW') {
                const payload = JSON.parse(job.payload);
                const Photoshop = require('./photoshop');
                const ps = new Photoshop(logger);

                let templateDir = this.watcher.templates.get(job.template_key);
                if (!templateDir && process.env.ENABLE_SIMULATION === 'true') {
                    templateDir = path.join(config.dropboxRoot, job.template_key);
                }

                if (!templateDir) {
                    throw new Error(`Template not found: ${job.template_key}`);
                }

                const templatePath = path.join(templateDir, `${job.template_key}.psd`);
                const outputPath = path.join(__dirname, 'temp_previews', `${payload.itemId}.png`);

                // Ensure temp directory exists
                const tempDir = path.join(__dirname, 'temp_previews');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                logger.info(`Rendering preview: ${templatePath} -> ${outputPath}`);

                await ps.renderPreview(templatePath, {
                    ai_data: payload.ai_data,
                    mappings: payload.mappings || {}
                }, outputPath);

                // Upload to PWA
                const FormData = require('form-data');
                const form = new FormData();
                form.append('itemId', payload.itemId);
                form.append('file', fs.createReadStream(outputPath));

                await axios.post(`${config.apiBaseUrl}/previews/upload`, form, {
                    headers: form.getHeaders()
                });

                // Clean up temp file
                fs.unlinkSync(outputPath);

                await axios.post(`${config.apiBaseUrl}/jobs`, {
                    jobId: job.id,
                    type: job.type,
                    status: 'completed'
                });
                return;
            }

            if (job.type === 'ORDER_BATCH') {
                // Unified Folder: Dropbox/OUTPUT/Order_ID_Customer/
                const safeName = job.customer_name.replace(/[^a-z0-9]/gi, '_');
                const orderFolderName = `Order_${job.woo_id}_${safeName}`;
                const outputDir = path.join(path.dirname(config.dropboxRoot), 'OUTPUT', orderFolderName);

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                // Initialize Photoshop Wrapper
                const Photoshop = require('./photoshop');
                const Imposition = require('./imposition');
                const ps = new Photoshop(logger);
                const imp = new Imposition();

                for (const item of job.items) {
                    logger.info(`  -> Item: ${item.product_name} (${item.template_key})`);

                    let templateDir = this.watcher.templates.get(item.template_key);

                    if (!templateDir && process.env.ENABLE_SIMULATION === 'true') {
                        templateDir = path.join(config.dropboxRoot, item.template_key);
                    }

                    if (!templateDir) {
                        logger.error(`Template not found: ${item.template_key}`);
                        continue;
                    }

                    // READ MANIFEST (Search for dimensions)
                    const manifestPath = path.join(templateDir, 'manifest.json');
                    let width = 105, height = 148; // Defaults (A6)

                    if (fs.existsSync(manifestPath)) {
                        try {
                            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                            if (manifest.width) width = manifest.width;
                            if (manifest.height) height = manifest.height;
                        } catch (e) {
                            logger.warn(`Could not parse manifest at ${manifestPath}`);
                        }
                    }

                    const layout = imp.calculateLayout(width, height, 2, this.settings.SHEET_SIZE || 'SRA3');
                    const templatePath = path.join(templateDir, `${item.template_key}.psd`);

                    // Specific sub-folder for item files
                    const itemOutputDir = path.join(outputDir, item.template_key);
                    if (!fs.existsSync(itemOutputDir)) fs.mkdirSync(itemOutputDir);

                    // Pass both Job Data, Mapping AND Layout Data to Photoshop
                    await ps.processJob(templatePath, {
                        layers: item.ai_data,
                        mappings: item.mappings || {},
                        imposition: layout
                    }, itemOutputDir);
                }

                logger.info('Batch job completed.');

                // Notify PWA
                await axios.post(`${config.apiBaseUrl}/jobs`, {
                    jobId: job.id,
                    type: job.type,
                    status: 'completed',
                    resultPath: outputDir
                });

            } else if (job.type === 'TEMPLATE_SCAN') {
                // Handle template scanning if needed (Phase 4?)
                logger.info(`Scanning template: ${job.template_key}`);
                // Implementation pending...
            }

        } catch (error) {
            logger.error(`Job Failed: ${error.message}`);
            await axios.post(`${config.apiBaseUrl}/jobs`, {
                jobId: job.id,
                type: job.type,
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
