const VendorService = require('../../src/services/vendor_service');
const SecretsProvider = require('../../src/secrets_provider');

jest.mock('../../src/secrets_provider');

describe('VendorService', () => {
    let vendorService;

    beforeEach(() => {
        SecretsProvider.mockImplementation(() => ({
            getSecret: jest.fn((key) => {
                const mockSecrets = {
                    salesforce_oauth_token: 'mock-oauth-token',
                    hubspot_api_key: 'mock-api-key',
                    zoho_basic_username: 'user',
                    zoho_basic_password: 'pass',
                };
                return Promise.resolve(mockSecrets[key]);
            }),
        }));

        vendorService = new VendorService();
    });

    it('should return vendor config with correct headers for salesforce', async () => {
        const config = await vendorService.getVendorConfig('salesforce');
        expect(config.headers.Authorization).toBe('Bearer mock-oauth-token');
        expect(config.vendorId).toBe('salesforce');
    });

    it('should throw error for unknown vendor', async () => {
        await expect(vendorService.getVendorConfig('fake')).rejects.toThrow('Unknown vendor: fake');
    });

    it('should calculate poll interval >= 5s', async () => {
        const config = await vendorService.getVendorConfig('hubspot');
        expect(config.pollInterval).toBeGreaterThanOrEqual(5);
    });
});
