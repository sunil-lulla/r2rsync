// vendor_rate_limiter.js
class VendorRateLimiter {
  constructor(vendorConfigs) {
      this.state = new Map(); // vendorId => { backoffUntil, retryCount }
      this.vendorConfigs = vendorConfigs;
  }

  canProceed(vendorId) {
      const entry = this.state.get(vendorId);
      if (!entry) return true;
      return Date.now() > entry.backoffUntil;
  }

  applyBackoff(vendorId) {
      const now = Date.now();
      const entry = this.state.get(vendorId) || { retryCount: 0, backoffUntil: 0 };
      entry.retryCount += 1;

      const waitTimeMs = Math.min(5 * 60 * 1000, 2 ** entry.retryCount * 1000); // up to 5 min
      entry.backoffUntil = now + waitTimeMs;

      this.state.set(vendorId, entry);
      return waitTimeMs;
  }

  resetBackoff(vendorId) {
      if (this.state.has(vendorId)) {
          this.state.set(vendorId, { retryCount: 0, backoffUntil: 0 });
      }
  }
}

module.exports = VendorRateLimiter;
