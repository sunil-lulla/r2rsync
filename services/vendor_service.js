// VendorService.js

const SecretsProvider = require('../secrets_provider');
// https://683c621728a0b0f2fdc6fea4.mockapi.io/salesforce_leads/
class VendorService {
    constructor() {
        this.secretsProvider = new SecretsProvider();

        this.vendorConfigs = {
            salesforce: {
                vendorId: 'salesforce',
                apiUrl: 'https://683c621728a0b0f2fdc6fea4.mockapi.io/salesforce_leads',
                authType: 'oauth',
                // Just metadata, no tokens here
                secretNames: {
                    oauthToken: 'salesforce_oauth_token',
                },
                limits: {
                    maxDailyCalls: 1000,
                    maxCallsPerWindow: 15000,
                    windowInSeconds: 86400,
                },
            },
            hubspot: {
                vendorId: 'hubspot',
                apiUrl: 'https://683c621728a0b0f2fdc6fea4.mockapi.io/salesforce_leads',
                authType: 'apiKey',
                apiKeyHeaderName: 'X-HubSpot-API-Key',
                secretNames: {
                    apiKey: 'hubspot_api_key',
                },
                limits: {
                    maxCallsPerMinute: 100,
                    maxCallsPerHour: 3000,
                },
            },
            zoho: {
                vendorId: 'zoho',
                apiUrl: 'https://www.zohoapis.com',
                authType: 'basic',
                secretNames: {
                    username: 'zoho_basic_username',
                    password: 'zoho_basic_password',
                },
                limits: {
                    maxCallsPerMinute: 50,
                },
            },
            customVendor: {
                vendorId: 'customVendor',
                apiUrl: 'https://api.customvendor.com',
                authType: 'none',
                limits: {
                    maxCallsPerDay: 50000,
                    maxCallsPerMinute: 200,
                    maxCallsPerHour: 20000,
                },
            },
        };
    }

    _calcIntervalForLimit(count, seconds) {
        return seconds / count;
    }

    async _getAuthHeaders(vendorConfig) {
        switch (vendorConfig.authType) {
            case 'oauth': {
                const token = await this.secretsProvider.getSecret(vendorConfig.secretNames.oauthToken);
                if (!token) throw new Error(`Missing OAuth token for ${vendorConfig.vendorId}`);
                return { Authorization: `Bearer ${token}` };
            }

            case 'apiKey': {
                const apiKey = await this.secretsProvider.getSecret(vendorConfig.secretNames.apiKey);
                if (!apiKey) throw new Error(`Missing API Key for ${vendorConfig.vendorId}`);
                return { [vendorConfig.apiKeyHeaderName]: apiKey };
            }

            case 'basic': {
                const username = await this.secretsProvider.getSecret(vendorConfig.secretNames.username);
                const password = await this.secretsProvider.getSecret(vendorConfig.secretNames.password);
                if (!username || !password) throw new Error(`Missing basic auth credentials for ${vendorConfig.vendorId}`);
                const encoded = Buffer.from(`${username}:${password}`).toString('base64');
                return { Authorization: `Basic ${encoded}` };
            }

            case 'none':
                return {};

            default:
                throw new Error(`Unknown auth type ${vendorConfig.authType} for vendor ${vendorConfig.vendorId}`);
        }
    }

    async getVendorConfig(vendorId) {
        const config = this.vendorConfigs[vendorId];
        if (!config) throw new Error(`Unknown vendor: ${vendorId}`);

        const limits = config.limits || {};
        const intervals = [];

        if (limits.maxDailyCalls) intervals.push(this._calcIntervalForLimit(limits.maxDailyCalls, 86400));
        if (limits.maxCallsPerWindow && limits.windowInSeconds) intervals.push(this._calcIntervalForLimit(limits.maxCallsPerWindow, limits.windowInSeconds));
        if (limits.maxCallsPerMinute) intervals.push(this._calcIntervalForLimit(limits.maxCallsPerMinute, 60));
        if (limits.maxCallsPerHour) intervals.push(this._calcIntervalForLimit(limits.maxCallsPerHour, 3600));

        if (intervals.length === 0){
            // MOCK:Raise Error if no limits are defined
            console.error("None of the vendors are available to be polled");
        }

        let pollIntervalSeconds = Math.max(...intervals);

        // Ensure minimum poll interval of 5 seconds
        if (pollIntervalSeconds < 5) {
            pollIntervalSeconds = 5;
        }

        const headers = await this._getAuthHeaders(config);

        return {
            vendorId: config.vendorId,
            apiUrl: config.apiUrl,
            rateLimitInfo: limits,
            pollInterval: pollIntervalSeconds,
            headers,
        };
    }

}

// getVendorConfig('salesforce');

module.exports = VendorService;
