const VendorRateLimiter = require('../../src/lib/vendor_rate_limiter');

jest.useFakeTimers();

describe('VendorRateLimiter', () => {
    const vendorConfigs = {
        salesforce: {
            limits: {
                maxCallsPerMinute: 2,
            },
        },
    };

    let limiter;

    beforeEach(() => {
        limiter = new VendorRateLimiter(vendorConfigs);
    });

    it('should allow calls under the limit', () => {
        expect(limiter.isAllowed('salesforce')).toBe(true);
        expect(limiter.isAllowed('salesforce')).toBe(true);
    });

    it('should block calls over the limit', () => {
        limiter.isAllowed('salesforce');
        limiter.isAllowed('salesforce');
        expect(limiter.isAllowed('salesforce')).toBe(false);
    });

    it('should reset call count after 1 minute', () => {
        limiter.isAllowed('salesforce');
        limiter.isAllowed('salesforce');
        expect(limiter.isAllowed('salesforce')).toBe(false);

        jest.advanceTimersByTime(60000);
        expect(limiter.isAllowed('salesforce')).toBe(true);
    });

    it('should apply exponential backoff after 429', () => {
        limiter.setBackoff('salesforce');
        expect(limiter.isAllowed('salesforce')).toBe(false);

        jest.advanceTimersByTime(60000); // 1st backoff duration
        expect(limiter.isAllowed('salesforce')).toBe(true);
    });

    it('should increase backoff on repeated 429s', () => {
        limiter.setBackoff('salesforce');
        jest.advanceTimersByTime(60000);
        expect(limiter.isAllowed('salesforce')).toBe(true);

        limiter.setBackoff('salesforce');
        jest.advanceTimersByTime(120000);
        expect(limiter.isAllowed('salesforce')).toBe(true);
    });
});
