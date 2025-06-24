# Connector Service

Basic representation of connector service that will consume data from queue & Vendor Service, and update data to Horizon
---

## 📊 Purpose

Efficiently poll external vendor APIs (Salesforce, Hubspot, Zoho, etc.) with:

* Configurable polling intervals
* API rate limiting
* Exponential backoff on 429 responses
* Mock Kafka-style messaging using files

---

## 🔧 Components

### 1. **VendorService**

* Manages vendor configurations, API URLs, rate limits, and authentication
* Computes polling intervals from rate limits
* Fetches required auth headers from a SecretsProvider

### 2. **Poller**

* Periodically emits polling messages to `mockQueue.jsonl`
* One polling loop per vendor, rate-aware

### 3. **KafkaConsumer**

* Consumes messages from `mockQueue.jsonl`
* Makes `axios` calls with headers and URL
* Handles 429s with exponential backoff per vendor
* Pushes successful API responses to `responseQueue.jsonl`

### 4. **KafkaProducer**

* Writes messages (polling or responses) to appropriate JSONL files

### 5. **VendorRateLimiter**

* Tracks usage per vendor
* Enforces max calls per window/minute/hour/day
* Applies exponential delay after 429 responses

---

## 📂 Directory Structure

```
.
├── kafka/
│   ├── consumer.js
│   └── producer.js
├── poller/
│   ├── index.js         # Start Poller
│   ├── mockQueue.jsonl         # Polling requests
│   └── responseQueue.jsonl     # API responses
├── services/
│   └── vendor_rate_limiter.js
│   └── vendor_service.js
├── logger.js
├── poller.js                   # Core polling logic
├── index.js                    # Main entry point
├── secrets_provider.js         # Mock/actual secret manager
```

---

## Running the Project

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Poller + Consumer
Both should run side by side to mimic poller behavior
```bash
cd poller && node index.js
node index.js
```

* Initializes pollers based on rate limits
* Starts consumer to make API calls and push responses

---

## 🚧 Rate Limiting

* Supports daily, hourly, minute, and windowed rate limits
* Calculates safest interval from limits
* Defaults to 5s if no limits provided

### Backoff Strategy

* On HTTP 429:

  * 1st failure: wait 1 minute
  * 2nd failure: wait 2 minutes
  * 3rd failure: wait 5 minutes
  * Max capped to avoid runaway delay

---

## 🔐 Auth Support

Supported `authType`s per vendor:

* `oauth` (Bearer token)
* `apiKey` (Custom header)
* `basic` (Base64 username\:password)
* `none`

Secrets are fetched via `SecretsProvider`.

---

## 📃 Sample Data

### mockQueue.jsonl

```json
{"vendorId":"salesforce","url":"https://api.salesforce.com/leads","lastFetchTimestamp":1717256610111}
```

### responseQueue.jsonl

```json
{"vendorId":"salesforce","id":"abc123","timestamp":1717257110111,"data":[{"name":"John Doe"}]}
```

## 📦 Sample Vendor Config (from `VendorService`)

```js
salesforce: {
    vendorId: 'salesforce',
    apiUrl: 'https://mockapi.io/salesforce_leads',
    authType: 'oauth',
    secretNames: {
        oauthToken: 'salesforce_oauth_token',
    },
    limits: {
        maxDailyCalls: 1000,
        maxCallsPerWindow: 15000,
        windowInSeconds: 86400,
    },
}
```

---
