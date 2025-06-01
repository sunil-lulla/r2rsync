const fs = require('fs');
const path = require('path');
const KafkaProducer = require('../../src/kafka/producer');

jest.mock('fs');

describe('KafkaProducer', () => {
    const filePath = './poller/outboundMessages.jsonl';
    let producer;

    beforeEach(() => {
        fs.appendFileSync.mockClear();
        producer = new KafkaProducer(filePath);
    });

    it('should append message to file', () => {
        const topic = 'mock-topic';
        const message = { id: 1, text: 'Hello Kafka' };

        producer.send(topic, message);

        expect(fs.appendFileSync).toHaveBeenCalledWith(
            filePath,
            expect.stringContaining(JSON.stringify(message))
        );
    });

    it('should include newline after message', () => {
        const message = { id: 42 };
        producer.send('mock', message);

        const content = fs.appendFileSync.mock.calls[0][1];
        expect(content.endsWith('\n')).toBe(true);
    });
});
