# Optimized HTTP Client Wrapper

An optimized HTTP client that implements request deduplication and concurrency control per endpoint.

[![NPM Version](https://img.shields.io/npm/v/http-client-wrapper.svg)](https://www.npmjs.com/package/http-client-wrapper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Demo](#running-the-demo)
- [Usage in Your Code](#usage-in-your-code)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [License](#license)

## Features

- Deduplicates identical in-flight requests
- Limits concurrent requests per endpoint to 3 (configurable)
- Handles request timeouts
- Proper error handling
- No caching or authentication required
- Treats full URL (including query parameters) as unique identifier

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

## Installation

1. Clone the repository:
```bash
git clone https://github.com/audunklyve/api-utviklertest.git
```

2. Install dependencies:
```bash
npm install
```

## Running the Demo

The demo application showcases three test scenarios:
1. Basic concurrent requests
2. Duplicate request handling (deduplication)
3. Error handling (404, 500, and timeout scenarios)

To run the demo:

```bash
npm run demo
```

## Usage in Your Code

```javascript
const HttpClient = require('./src/HttpClient');

// Create a client instance with custom settings
const client = new HttpClient(
    3,    // Maximum concurrent requests per endpoint
    9000  // Request timeout in milliseconds (default)
);

// Example: Making requests
async function example() {
    try {
        // Single request
        const response = await client.get('https://httpbin.org/anything');
        console.log('Response:', response);

        // Multiple concurrent requests
        const urls = [
            'https://httpbin.org/anything?param=1',
            'https://httpbin.org/anything?param=2',
            'https://httpbin.org/anything?param=3'
        ];
        const results = await Promise.all(
            urls.map(url => client.get(url))
        );
        console.log('Results:', results);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Example with error handling
async function exampleWithErrorHandling() {
    const urls = [
        'https://httpbin.org/anything',
        'https://httpbin.org/status/404',
        'https://httpbin.org/delay/10'  // Will timeout
    ];

    const results = await Promise.allSettled(
        urls.map(async url => {
            try {
                const response = await client.get(url);
                return { url, status: 'success', data: response };
            } catch (error) {
                return { url, status: 'error', error: error.message };
            }
        })
    );

    results.forEach(result => {
        if (result.value.status === 'success') {
            console.log(`✅ Success for ${result.value.url}`);
        } else {
            console.error(`❌ Error for ${result.value.url}:`, result.value.error);
        }
    });
}
```

## API Reference

### HttpClient Class

#### Constructor

```javascript
new HttpClient(maxConcurrentRequestsPerEndpoint = 3, requestTimeout = 9000)
```

- `maxConcurrentRequestsPerEndpoint`: Maximum number of concurrent requests allowed per endpoint
- `requestTimeout`: Request timeout in milliseconds

#### Methods

##### `get(url)`
Makes a GET request to the specified URL.
- Parameters:
  - `url` (string): The URL to fetch
- Returns: Promise that resolves with the response data
- Throws: Error for timeouts, non-2xx status codes, or network errors

##### `reset()`
Clears all queues and in-flight requests. Useful for cleanup.

## Error Handling

The client throws errors in the following cases:
- Invalid URL format
- Request timeout
- Non-2xx HTTP status codes
- Network errors

Each error includes a descriptive message indicating the type of error and relevant details.

Example error handling:
```javascript
try {
    const response = await client.get('https://httpbin.org/anything');
    console.log('Success:', response);
} catch (error) {
    if (error.message.includes('timeout')) {
        console.error('Request timed out');
    } else if (error.response?.status === 404) {
        console.error('Resource not found');
    } else {
        console.error('Unknown error:', error.message);
    }
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Development Notes

This project was created as part of a technical assessment.