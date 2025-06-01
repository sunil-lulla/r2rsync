
// secretsProvider.js
// Mock Vault secret fetcher
class SecretsProvider {
    constructor() {
        // Simulate some secrets stored in Vault or secret manager
        this.secrets = {
            salesforce_oauth_token: 'vault-salesforce-token-123',
            hubspot_api_key: 'vault-hubspot-apikey-456',
            zoho_basic_username: 'vault-zoho-user',
            zoho_basic_password: 'vault-zoho-pass',
        };
    }

    async getSecret(secretName) {
        // Simulate async Vault/API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.secrets[secretName]);
            }, 100); // small delay to mimic network call
        });
    }
}

module.exports = SecretsProvider;
