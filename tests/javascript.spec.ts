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

import { test, expect } from './fixtures';

test.describe('JavaScript Evaluation', () => {
  test('should execute simple JavaScript and return result', async ({ connection, testServer }) => {
    const { url } = await testServer.get('', '<html><body><h1>Test Page</h1></body></html>');
    
    // Navigate to test page
    await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: { url },
      },
    });

    // Execute simple JavaScript
    const result = await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_evaluate',
        arguments: {
          script: 'return 2 + 2;',
        },
      },
    });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('✅ JavaScript executed successfully');
    expect(result.content[0].text).toContain('Returned: 4');
  });

  test('should access DOM elements', async ({ connection, testServer }) => {
    const { url } = await testServer.get('', '<html><body><h1 id="title">Hello World</h1></body></html>');
    
    await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: { url },
      },
    });

    const result = await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_evaluate',
        arguments: {
          script: 'return document.getElementById("title").textContent;',
        },
      },
    });

    expect(result.content[0].text).toContain('✅ JavaScript executed successfully');
    expect(result.content[0].text).toContain('Returned: "Hello World"');
  });

  test('should handle complex objects', async ({ connection, testServer }) => {
    const { url } = await testServer.get('', '<html><body></body></html>');
    
    await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: { url },
      },
    });

    const result = await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_evaluate',
        arguments: {
          script: 'return { name: "test", value: 42, nested: { data: [1, 2, 3] } };',
        },
      },
    });

    expect(result.content[0].text).toContain('✅ JavaScript executed successfully');
    expect(result.content[0].text).toContain('"name": "test"');
    expect(result.content[0].text).toContain('"value": 42');
  });

  test('should handle errors gracefully', async ({ connection, testServer }) => {
    const { url } = await testServer.get('', '<html><body></body></html>');
    
    await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: { url },
      },
    });

    const result = await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_evaluate',
        arguments: {
          script: 'throw new Error("Test error");',
        },
      },
    });

    expect(result.content[0].text).toContain('❌ JavaScript execution failed');
    expect(result.content[0].text).toContain('Test error');
  });

  test('should handle undefined return value', async ({ connection, testServer }) => {
    const { url } = await testServer.get('', '<html><body></body></html>');
    
    await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: { url },
      },
    });

    const result = await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_evaluate',
        arguments: {
          script: 'console.log("test");',
        },
      },
    });

    expect(result.content[0].text).toContain('✅ JavaScript executed successfully');
    expect(result.content[0].text).toContain('Returned: undefined');
  });

  test('should handle multiline scripts', async ({ connection, testServer }) => {
    const { url } = await testServer.get('', '<html><body><div id="container"></div></body></html>');
    
    await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: { url },
      },
    });

    const result = await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_evaluate',
        arguments: {
          script: `
            const container = document.getElementById('container');
            container.innerHTML = '<p>Dynamic content</p>';
            return container.innerHTML;
          `,
        },
      },
    });

    expect(result.content[0].text).toContain('✅ JavaScript executed successfully');
    expect(result.content[0].text).toContain('Dynamic content');
  });

  test('should modify page state', async ({ connection, testServer }) => {
    const { url } = await testServer.get('', '<html><body><button id="btn">Click me</button></body></html>');
    
    await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_navigate',
        arguments: { url },
      },
    });

    // Modify button text
    await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_evaluate',
        arguments: {
          script: 'document.getElementById("btn").textContent = "Modified";',
        },
      },
    });

    // Verify the change
    const result = await connection.request({
      method: 'tools/call',
      params: {
        name: 'browser_evaluate',
        arguments: {
          script: 'return document.getElementById("btn").textContent;',
        },
      },
    });

    expect(result.content[0].text).toContain('Returned: "Modified"');
  });
});