const HttpClient = require('./HttpClient');

async function runTest(name, urls, client) {
  console.log(`\n${name}`);
  const results = await Promise.allSettled(
    urls.map(async url => {
      try {
        const response = await client.get(url);
        console.log(`✅ Success: ${url}`);
        return response;
      } catch (error) {
        console.error(`❌ Error: ${url} - ${error.message}`);
      }
    })
  );
  console.log(`${name} completed.\n`);
}

async function runDemo() {
  const client = new HttpClient(3, 3000);

  // Test 1: Basic concurrent requests
  const urls = [
    'https://httpbin.org/anything?param=1',
    'https://httpbin.org/anything?param=2',
    'https://httpbin.org/anything?param=3',
    'https://httpbin.org/anything?param=4',
    'https://httpbin.org/anything?param=5',
  ];
  await runTest('Test 1: Basic concurrent requests', urls, client);

  // Test 2: Duplicate requests
  const duplicateUrls = [
    'https://httpbin.org/anything?test=duplicate',
    'https://httpbin.org/anything?test=duplicate',
    'https://httpbin.org/anything?test=duplicate',
  ];
  await runTest('Test 2: Duplicate requests (should be deduplicated)', duplicateUrls, client);

  // Test 3: Error handling
  const errorUrls = [
    'https://httpbin.org/status/404',
    'https://httpbin.org/status/500',
    'https://httpbin.org/delay/5', // This will now timeout after 3 seconds
  ];
  await runTest('Test 3: Error handling', errorUrls, client);

  client.reset();
}

runDemo().catch(console.error); 