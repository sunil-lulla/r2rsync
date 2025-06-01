// kafka/producer.js
const fs = require('fs');
const path = require('path');

class KafkaProducer {
    constructor() {
        this.queues = {
            Q2: path.join(__dirname, '../poller/mockQueue.jsonl'),
            responseQueue: path.join(__dirname, '../poller/responseQueue.jsonl'),
        };
    }

    send(queueName, message) {
        const filePath = this.queues[queueName];
        if (!filePath) throw new Error(`Unknown queue: ${queueName}`);

        const payload = JSON.stringify(message) + '\n';
        fs.appendFileSync(filePath, payload, 'utf8');
    }
}

module.exports = KafkaProducer;
