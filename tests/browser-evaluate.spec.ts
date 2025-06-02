/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test, expect } from './fixtures.js';

test('browser_evaluate - simple expression', async ({ client, server }) => {
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  try {
    const result = await client.callTool({
      name: 'browser_evaluate',
      arguments: { 
        expression: '2 + 2'
      },
    });
    
    // Log the actual result to debug
    console.log('Result:', JSON.stringify(result, null, 2));
    
    const response = JSON.parse(result.content[0].text);
    expect(response.result).toBe('4');
    expect(response.type).toBe('number');
  } catch (error) {
    console.error('Error calling browser_evaluate:', error);
    throw error;
  }
});

test('browser_evaluate - with args', async ({ client, server }) => {
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  const result = await client.callTool({
    name: 'browser_evaluate',
    arguments: { 
      expression: 'return arg0 + arg1',
      args: [5, 10]
    },
  });
  
  const response = JSON.parse(result.content[0].text);
  expect(response.result).toBe('15');
  expect(response.type).toBe('number');
});

test('browser_evaluate - async function', async ({ client, server }) => {
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  const result = await client.callTool({
    name: 'browser_evaluate',
    arguments: { 
      expression: 'return new Promise(resolve => setTimeout(() => resolve("delayed"), 100))',
      awaitPromise: true
    },
  });
  
  const response = JSON.parse(result.content[0].text);
  expect(response.result).toBe('"delayed"');
  expect(response.type).toBe('string');
});

test('browser_evaluate - console messages', async ({ client, server }) => {
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  const result = await client.callTool({
    name: 'browser_evaluate',
    arguments: { 
      expression: 'console.log("test message"); return 42'
    },
  });
  
  const response = JSON.parse(result.content[0].text);
  expect(response.result).toBe('42');
  expect(response.type).toBe('number');
  expect(response.console).toContain('test message');
});

test('browser_evaluate - error handling', async ({ client, server }) => {
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  const result = await client.callTool({
    name: 'browser_evaluate',
    arguments: { 
      expression: 'throw new Error("test error")'
    },
  });
  
  const response = JSON.parse(result.content[0].text);
  expect(response.result).toBe(null);
  expect(response.type).toBe('error');
  expect(response.error).toContain('test error');
});

test('browser_evaluate - timeout', async ({ client, server }) => {
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  const result = await client.callTool({
    name: 'browser_evaluate',
    arguments: { 
      expression: 'return new Promise(() => {})', // Never resolves
      awaitPromise: true,
      timeout: 1000
    },
  });
  
  const response = JSON.parse(result.content[0].text);
  expect(response.result).toBe(null);
  expect(response.type).toBe('error');
  expect(response.error).toContain('timed out');
});

test('browser_evaluate - complex object', async ({ client, server }) => {
  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  });

  const result = await client.callTool({
    name: 'browser_evaluate',
    arguments: { 
      expression: 'return { foo: "bar", nested: { value: 123 }, arr: [1, 2, 3] }'
    },
  });
  
  const response = JSON.parse(result.content[0].text);
  const resultObj = JSON.parse(response.result);
  expect(resultObj.foo).toBe('bar');
  expect(resultObj.nested.value).toBe(123);
  expect(resultObj.arr).toEqual([1, 2, 3]);
  expect(response.type).toBe('object');
});

test('browser_evaluate - DOM manipulation', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div id="target">Original Text</div>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  const result = await client.callTool({
    name: 'browser_evaluate',
    arguments: { 
      expression: `
        const el = document.getElementById('target');
        el.textContent = 'Modified Text';
        return el.textContent;
      `
    },
  });
  
  const response = JSON.parse(result.content[0].text);
  expect(response.result).toBe('"Modified Text"');
  
  // Verify the DOM was actually modified
  const snapshot = await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });
  expect(snapshot.content[0].text).toContain('Modified Text');
});