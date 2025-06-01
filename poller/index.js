// poller.js
const fs = require('fs');
const path = require('path');
const VendorService = require('../services/vendor_service.js');
const { logger } = require('../logger');
const crypto = require('crypto');

const QUEUE_FILE = path.join(__dirname, 'mockQueue.jsonl');

class Poller {
    constructor(vendorService) {
        this.vendorService = vendorService;
        this.intervals = new Map();
    }

    async start(vendorIds) {
        for (const vendorId of vendorIds) {
            try {
                const config = await this.vendorService.getVendorConfig(vendorId);
                const interval = Math.max(config.pollInterval || 10, 5) * 1000;

                logger.info(`Starting poller for ${vendorId} every ${interval / 1000}s`);

                const timer = setInterval(async () => {
                    const message = {
                        id: crypto.randomUUID(),
                        vendorId,
                        url: config.apiUrl,
                        lastFetchTimestamp: Date.now(),
                        retries: 0,
                    };

                    fs.appendFileSync(QUEUE_FILE, JSON.stringify(message) + '\n');
                    logger.debug(`Appended polling message for ${vendorId}`);
                }, interval);

                this.intervals.set(vendorId, timer);
            } catch (err) {
                logger.error(`Poller setup failed for ${vendorId}: ${err.message}`);
            }
        }
    }

    stopAll() {
        for (const [, timer] of this.intervals.entries()) {
            clearInterval(timer);
        }
        this.intervals.clear();
    }
}

(async () => {
    const vendorService = new VendorService();
    const poller = new Poller(vendorService);
    await poller.start(['salesforce', 'hubspot']);
})();
