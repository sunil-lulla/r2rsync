const fs = require('fs');
const KafkaConsumer = require('../../src/kafka/consumer');

describe('KafkaConsumer', () => {
    const filePath = './poller/mockQueue.jsonl';

    beforeEach(() => {
        fs.readFileSync = jest.fn(() =>
            [
                JSON.stringify({ vendorId: 'salesforce', id: 1 }),
                JSON.stringify({ vendorId: 'hubspot', id: 2 }),
            ].join('\n')
        );
    });

    it('should parse each line and call handler', async () => {
        const messages = [];
        const consumer = new KafkaConsumer({ filePath });

        await consumer.run({
            eachMessage: async ({ message }) => {
                messages.push(message);
            },
        });

        expect(messages.length).toBe(2);
        expect(messages[0].vendorId).toBe('salesforce');
        expect(messages[1].id).toBe(2);
    });
});
