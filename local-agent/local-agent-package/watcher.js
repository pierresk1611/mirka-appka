const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

class Watcher {
    constructor(rootPath, logger) {
        this.rootPath = rootPath;
        this.logger = logger;
        this.templates = new Map();
    }

    start() {
        this.logger.info(`Watching Dropbox Templates at: ${this.rootPath}`);

        // Watch for changes in the TEMPLATES directory
        const watcher = chokidar.watch(this.rootPath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            depth: 1 // Only look at top level folders (JSO_15, WED_42)
        });

        watcher
            .on('addDir', path => this.registerTemplate(path))
            .on('unlinkDir', path => this.removeTemplate(path))
            .on('ready', () => this.logger.info('Initial scan complete. Ready for changes.'));
    }

    registerTemplate(dirPath) {
        const folderName = path.basename(dirPath);
        this.logger.info(`Detected Template: ${folderName}`);

        // Check for manifest.json or .psd files
        // We can optionally read manifest.json here to cache capabilities
        this.templates.set(folderName, dirPath);
    }

    removeTemplate(dirPath) {
        const folderName = path.basename(dirPath);
        this.logger.info(`Removed Template: ${folderName}`);
        this.templates.delete(folderName);
    }
}

module.exports = Watcher;
