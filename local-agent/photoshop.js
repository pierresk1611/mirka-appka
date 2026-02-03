const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class Photoshop {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Executes the JSX script in Photoshop with the provided data.
     * @param {string} templatePath - Absolute path to the PSD template.
     * @param {object} jobData - JSON object with text layers and settings.
     * @param {string} outputPath - Path to save the output.
     */
    async processJob(templatePath, jobData, outputPath) {
        if (process.env.ENABLE_SIMULATION === 'true') {
            this.logger.info(`[SIMULATION] Processing job for ${templatePath}`);
            this.logger.info(`[SIMULATION] Data: ${JSON.stringify(jobData)}`);
            this.logger.info(`[SIMULATION] Simulating Photoshop PDF generation... (3s)`);
            return new Promise(resolve => setTimeout(() => {
                this.logger.info(`[SIMULATION] Job Finished. Output at: ${outputPath}`);
                resolve("Job Completed (Simulated)");
            }, 3000));
        }

        const scriptPath = path.resolve(__dirname, 'scripts', 'processor.jsx');

        // We pass data to the JSX script by writing a temporary JSON file
        // because passing complex objects via AppleScript arguments is tricky.
        const tempJsonPath = path.resolve(__dirname, 'temp_job.json');

        const payload = {
            template: templatePath,
            data: jobData,
            output: outputPath
        };

        fs.writeFileSync(tempJsonPath, JSON.stringify(payload));

        const appleScript = `
            tell application "Adobe Photoshop 2024"
                activate
                do javascript file "${scriptPath}" with arguments {"${tempJsonPath}"}
            end tell
        `;

        this.logger.info(`Sending job to Photoshop: ${templatePath}`);

        return new Promise((resolve, reject) => {
            exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
                // Clean up temp file
                try { fs.unlinkSync(tempJsonPath); } catch (e) { }

                if (error) {
                    this.logger.error(`Photoshop Error: ${stderr}`);
                    reject(error);
                } else {
                    this.logger.info(`Photoshop Output: ${stdout.trim()}`);
                    resolve(stdout.trim());
                }
            });
        });
    }
}

module.exports = Photoshop;
