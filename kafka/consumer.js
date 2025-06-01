// kafka/fileConsumer.js
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const EventEmitter = require('events');
// const { logger } = require('../logger');

class KafkaConsumer extends EventEmitter {
  constructor({ filePath, pollInterval = 1000 }) {
    super();
    this.filePath = filePath || path.join(__dirname, '../mockQueue.jsonl');
    this.pollInterval = pollInterval;
    this.lastReadSize = 0;
    this.processing = false;
    this.topic = 'mock-topic'; // Simulated topic name
  }

  subscribe(topic) {
    // For future extensibility
    this.topic = topic;
    console.info(`Subscribed to topic: ${topic}`);
  }

  run({ eachMessage }) {
    console.info(`Kafka-style file consumer started...`);
    this.timer = setInterval(() => this._poll(eachMessage), this.pollInterval);
  }

  async _poll(eachMessage) {
    if (this.processing) return;
    this.processing = true;

    try {
      const stats = fs.statSync(this.filePath);
      const newSize = stats.size;

      if (newSize <= this.lastReadSize) {
        this.processing = false;
        return;
      }

      const stream = fs.createReadStream(this.filePath, {
        start: this.lastReadSize,
        end: newSize,
        encoding: 'utf8'
      });

      const rl = readline.createInterface({ input: stream });

      for await (const line of rl) {
        if (!line.trim()) continue;

        try {
          const message = JSON.parse(line);
          await eachMessage({
            topic: this.topic,
            partition: 0,
            message
          });
        } catch (err) {
          console.error(`Failed to parse message: ${line}`);
          console.error(err.stack || err.message);
        }
      }

      this.lastReadSize = newSize;
    } catch (err) {
      console.error(`Error reading file: ${err.message}`);
    }

    this.processing = false;
  }

  stop() {
    clearInterval(this.timer);
    console.info('Kafka-style consumer stopped.');
  }
}

module.exports = KafkaConsumer;
