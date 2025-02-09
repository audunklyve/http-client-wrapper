const axios = require('axios');
const { default: PQueue } = require('p-queue');

/**
 * @typedef {Object} HttpClientOptions
 * @property {number} maxConcurrentRequestsPerEndpoint
 * @property {number} requestTimeout
 */

/**
 * @typedef {Object} HttpResponse
 * @property {any} data
 * @property {string} status
 */

/**
 * HttpClient provides an optimized way to make concurrent HTTP GET requests
 * with built-in request deduplication and endpoint concurrency limiting.
 */
class HttpClient {
  /**
   * @param {number} maxConcurrentRequestsPerEndpoint - Maximum concurrent requests per endpoint
   * @param {number} requestTimeout - Request timeout in milliseconds
   */
  constructor(maxConcurrentRequestsPerEndpoint = 3, requestTimeout = 9000) {
    this.inFlightRequests = new Map();
    this.endpointQueues = new Map();
    this.maxConcurrentRequestsPerEndpoint = maxConcurrentRequestsPerEndpoint;
    this.requestTimeout = requestTimeout;
  }

  getEndpoint(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80)}`;
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  async get(url) {
    if (typeof url !== 'string') {
      throw new TypeError('URL must be a string');
    }

    const endpoint = this.getEndpoint(url);

    if (!this.endpointQueues.has(endpoint)) {
      this.endpointQueues.set(
        endpoint, 
        new PQueue({ 
          concurrency: this.maxConcurrentRequestsPerEndpoint,
          timeout: this.requestTimeout,
          throwOnTimeout: true
        })
      );
    }

    if (this.inFlightRequests.has(url)) {
      return this.inFlightRequests.get(url);
    }

    const queue = this.endpointQueues.get(endpoint);
    const requestPromise = queue.add(
      () => this._fetch(url),
      { timeout: this.requestTimeout }
    ).finally(() => {
      setTimeout(() => {
        this.inFlightRequests.delete(url);
      }, 0);
    });

    this.inFlightRequests.set(url, requestPromise);
    return requestPromise;
  }

  async _fetch(url) {
    try {
      const response = await axios.get(url, {
        timeout: this.requestTimeout,
        validateStatus: status => status >= 200 && status < 300
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.name === 'TimeoutError') {
        throw new Error(`Request timeout for ${url} (${this.requestTimeout}ms)`);
      }
      if (error.response) {
        throw new Error(`HTTP ${error.response.status} error for ${url}: ${error.response.statusText}`);
      }
      throw new Error(`Network error for ${url}: ${error.message}`);
    }
  }

  reset() {
    this.inFlightRequests.clear();
    this.endpointQueues.forEach(queue => queue.clear());
    this.endpointQueues.clear();
  }
}

module.exports = HttpClient; 