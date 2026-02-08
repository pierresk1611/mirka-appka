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

    /**
     * Opens the PSD in Photoshop, fills layers, but keeps it open for user editing.
     */
    async openInPhotoshop(templatePath, jobData) {
        if (process.env.ENABLE_SIMULATION === 'true') {
            this.logger.info(`[SIMULATION] Opening for manual edit: ${templatePath}`);
            return;
        }

        const scriptPath = path.resolve(__dirname, 'scripts', 'open.jsx');
        const tempJsonPath = path.resolve(__dirname, 'temp_open.json');

        const payload = {
            template: templatePath,
            data: jobData
        };

        fs.writeFileSync(tempJsonPath, JSON.stringify(payload));

        const appleScript = `
            tell application "Adobe Photoshop 2024"
                activate
                do javascript file "${scriptPath}" with arguments {"${tempJsonPath}"}
            end tell
        `;

        this.logger.info(`Sending "Open" command to Photoshop: ${templatePath}`);

        return new Promise((resolve, reject) => {
            exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
                try { fs.unlinkSync(tempJsonPath); } catch (e) { }

                if (error) {
                    this.logger.error(`Photoshop Open Error: ${stderr}`);
                    reject(error);
                } else {
                    this.logger.info(`Photoshop Open Success: ${stdout.trim()}`);
                    resolve(stdout.trim());
                }
            });
        });
    }

    /**
     * Renders a preview PNG from PSD template with filled data.
     */
    async renderPreview(templatePath, jobData, outputPath) {
        if (process.env.ENABLE_SIMULATION === 'true') {
            this.logger.info(`[SIMULATION] Rendering preview: ${templatePath} -> ${outputPath}`);
            return;
        }

        const scriptPath = path.resolve(__dirname, 'scripts', 'render.jsx');
        const tempJsonPath = path.resolve(__dirname, 'temp_render.json');

        fs.writeFileSync(tempJsonPath, JSON.stringify(jobData));

        const appleScript = `
            tell application "Adobe Photoshop 2024"
                activate
                do javascript file "${scriptPath}" with arguments {"${templatePath}", "${tempJsonPath}", "${outputPath}"}
            end tell
        `;

        this.logger.info(`Rendering preview in Photoshop: ${templatePath}`);

        return new Promise((resolve, reject) => {
            exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
                try { fs.unlinkSync(tempJsonPath); } catch (e) { }

                if (error) {
                    this.logger.error(`Photoshop Render Error: ${stderr}`);
                    reject(error);
                } else {
                    this.logger.info(`Photoshop Render Success: ${stdout.trim()}`);
                    resolve(stdout.trim());
                }
            });
        });
    }
}

module.exports = Photoshop;
