const Poller = require('./poller');
const KafkaProducer = require('./kafka/producer');
const VendorService = require('./services/vendor_service');
const KafkaConsumer = require('./kafka/consumer');
const VendorRateLimiter = require('./services/vendor_rate_limiter');

const axios = require('axios');
const { logger } = require('./logger');

const vendorService = new VendorService();
const vendorConfigs = vendorService.vendorConfigs;
const limiter = new VendorRateLimiter(vendorConfigs);
const kafkaProducer = new KafkaProducer();

const consumer = new KafkaConsumer({ filePath: './poller/mockQueue.jsonl' });
consumer.subscribe('mock-topic');

consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
        const { vendorId, url, id, headers } = message;

        if (!limiter.canProceed(vendorId)) {
            logger.warn(`[SKIPPED] ${vendorId} is in cooldown.`);
            return;
        }

        try {
            logger.info(`[REQUEST] [${vendorId}] ${url}`);
            const res = await axios.get(url, { headers });

            logger.info(`[SUCCESS] [${vendorId}] ${res.status}`);

            limiter.resetBackoff(vendorId);

            // Write API response to new queue
            const outputMessage = {
                vendorId,
                id,
                timestamp: Date.now(),
                data: res.data, // or pick fields
            };

            kafkaProducer.send('responseQueue', outputMessage);
            logger.info(`[PRODUCED] Response for ${vendorId} written to responseQueue`);
        } catch (err) {
            if (err.response?.status === 429) {
                const waitTimeMs = limiter.applyBackoff(vendorId);
                logger.warn(`[429] [${vendorId}] Backing off for ${waitTimeMs / 1000}s`);
            } else {
                logger.error(`[ERROR] [${vendorId}] ${err.message}`);
            }
        }
    }
});
