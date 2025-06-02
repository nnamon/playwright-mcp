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

import fs from 'fs';

import { test, expect } from './fixtures.js';

test('browser_take_screenshot (viewport)', async ({ startClient, server }, testInfo) => {
  const client = await startClient({
    config: { outputDir: testInfo.outputPath('output') },
  });
  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  expect(await client.callTool({
    name: 'browser_take_screenshot',
  })).toEqual({
    content: [
      {
        data: expect.any(String),
        mimeType: 'image/jpeg',
        type: 'image',
      },
      {
        text: expect.stringContaining(`Screenshot viewport and save it as`),
        type: 'text',
      },
    ],
  });
});

test('browser_take_screenshot (element)', async ({ startClient, server }, testInfo) => {
  const client = await startClient({
    config: { outputDir: testInfo.outputPath('output') },
  });
  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`[ref=e1]`);

  expect(await client.callTool({
    name: 'browser_take_screenshot',
    arguments: {
      element: 'hello button',
      ref: 'e1',
    },
  })).toEqual({
    content: [
      {
        data: expect.any(String),
        mimeType: 'image/jpeg',
        type: 'image',
      },
      {
        text: expect.stringContaining(`page.getByText('Hello, world!').screenshot`),
        type: 'text',
      },
    ],
  });
});

test('--output-dir should work', async ({ startClient, server }, testInfo) => {
  const outputDir = testInfo.outputPath('output');
  const client = await startClient({
    config: { outputDir },
  });
  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  await client.callTool({
    name: 'browser_take_screenshot',
  });

  expect(fs.existsSync(outputDir)).toBeTruthy();
  const files = [...fs.readdirSync(outputDir)].filter(f => f.endsWith('.jpeg'));
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/^page-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.jpeg$/);
});

test('browser_take_screenshot (returnImage: true, raw: false)', async ({ startClient, server }, testInfo) => {
  const outputDir = testInfo.outputPath('output');
  const client = await startClient({
    config: { outputDir },
  });
  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  const result = await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { returnImage: true, raw: false },
  });

  expect(result).toEqual({
    content: [
      {
        data: expect.any(String),
        mimeType: 'image/jpeg',
        type: 'image',
      },
      {
        text: expect.stringContaining('Screenshot viewport'),
        type: 'text',
      },
    ],
  });
  // Ensure the more verbose output does not mention saving to a file
  expect(result.content.find(item => item.type === 'text')?.text).not.toContain('and save it as');
  expect(result.content.find(item => item.type === 'text')?.text).toContain('Ran Playwright code:');

  if (fs.existsSync(outputDir)) {
    const diskFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.png'));
    expect(diskFiles).toHaveLength(0); // No file should be saved
  }
});

test('browser_take_screenshot (returnImage: true, raw: true)', async ({ startClient, server }, testInfo) => {
  const outputDir = testInfo.outputPath('output');
  const client = await startClient({
    config: { outputDir },
  });
  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  const result = await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { returnImage: true, raw: true },
  });

  expect(result).toEqual({
    content: [
      {
        data: expect.any(String),
        mimeType: 'image/png',
        type: 'image',
      },
      {
        text: expect.stringContaining('Screenshot viewport'),
        type: 'text',
      },
    ],
  });
  // Ensure the more verbose output does not mention saving to a file
  expect(result.content.find(item => item.type === 'text')?.text).not.toContain('and save it as');
  expect(result.content.find(item => item.type === 'text')?.text).toContain('Ran Playwright code:');

  if (fs.existsSync(outputDir)) {
    const diskFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.png'));
    expect(diskFiles).toHaveLength(0); // No file should be saved
  }
});

for (const raw of [undefined, true]) {
  test(`browser_take_screenshot (returnImage: false, raw: ${raw})`, async ({ startClient, server }, testInfo) => {
    const outputDir = testInfo.outputPath('output');
    const ext = raw ? 'png' : 'jpeg';
    const client = await startClient({
      config: { outputDir },
    });
    expect(await client.callTool({
      name: 'browser_navigate',
      arguments: { url: server.PREFIX },
    })).toContainTextContent(`Navigate to http://localhost`);

    // Explicitly test returnImage: false (or undefined for raw=undefined case)
    expect(await client.callTool({
      name: 'browser_take_screenshot',
      arguments: { raw, returnImage: raw === undefined ? undefined : false },
    })).toEqual({
      content: [
        {
          data: expect.any(String),
          mimeType: `image/${ext}`,
          type: 'image',
        },
        {
          text: expect.stringMatching(
              new RegExp(`page-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}\\-\\d{3}Z\\.${ext}`)
          ),
          type: 'text',
        },
      ],
    });

    const files = [...fs.readdirSync(outputDir)].filter(f => f.endsWith(`.${ext}`));

    expect(fs.existsSync(outputDir)).toBeTruthy();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(
        new RegExp(`^page-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z\\.${ext}$`)
    );
  });

}

test('browser_take_screenshot (returnImage: false, filename: "output.jpeg")', async ({ startClient, server }, testInfo) => {
  const outputDir = testInfo.outputPath('output');
  const client = await startClient({
    config: { outputDir },
  });
  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  // Explicitly test returnImage: false
  expect(await client.callTool({
    name: 'browser_take_screenshot',
    arguments: {
      filename: 'output.jpeg',
      returnImage: false,
    },
  })).toEqual({
    content: [
      {
        data: expect.any(String),
        mimeType: 'image/jpeg',
        type: 'image',
      },
      {
        text: expect.stringContaining(`output.jpeg`),
        type: 'text',
      },
    ],
  });

  const files = [...fs.readdirSync(outputDir)].filter(f => f.endsWith('.jpeg'));

  expect(fs.existsSync(outputDir)).toBeTruthy();
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/^output\.jpeg$/);
});

// This test verifies that when returnImage is true, image is returned even if imageResponses=omit
test('browser_take_screenshot (returnImage: true, imageResponses=omit)', async ({ startClient, server }, testInfo) => {
  const outputDir = testInfo.outputPath('output');
  const client = await startClient({
    config: {
      outputDir,
      imageResponses: 'omit',
    },
  });

  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  const result = await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { returnImage: true },
  });

  expect(result.content).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.any(String),
        mimeType: 'image/jpeg',
        type: 'image',
      }),
      expect.objectContaining({
        text: expect.stringContaining('Screenshot viewport'),
        type: 'text',
      }),
    ])
  );
  expect(result.content.find(item => item.type === 'text')?.text).not.toContain('and save it as');
  expect(result.content.find(item => item.type === 'text')?.text).toContain('Ran Playwright code:');
  // Ensure no file was saved
  if (fs.existsSync(outputDir)) {
    const diskFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.png'));
    expect(diskFiles).toHaveLength(0);
  }
});

test('browser_take_screenshot (returnImage: false or undefined, imageResponses=omit)', async ({ startClient, server }, testInfo) => {
  const outputDir = testInfo.outputPath('output');
  const client = await startClient({
    config: {
      outputDir,
      imageResponses: 'omit',
    },
  });

  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  // Test with returnImage: false
  await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { returnImage: false, filename: 'omit-test1.jpeg' }
  });
  let diskFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('omit-test1.jpeg'));
  expect(diskFiles).toHaveLength(1);

  // Test with returnImage: undefined (default behavior)
  const resultUndefined = await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { filename: 'omit-test2.jpeg' /* returnImage is undefined */ },
  });
  expect(resultUndefined).toMatchObject({
    content: [
      {
        text: expect.stringContaining(`// Screenshot viewport and save it as`),
        type: 'text',
      },
    ],
  });
  const textContent = resultUndefined.content.find(item => item.type === 'text')?.text;
  expect(textContent).toContain('omit-test2.jpeg'); // Check for the specific filename
  expect(textContent).toContain('Ran Playwright code:');
  expect(textContent).toContain('Page URL:');
  diskFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('omit-test2.jpeg'));
  expect(diskFiles).toHaveLength(1);
});

// This test verifies that when returnImage is true, image is returned even if client is 'cursor:vscode'
test('browser_take_screenshot (returnImage: true, clientName: cursor:vscode)', async ({ startClient, server }, testInfo) => {
  const outputDir = testInfo.outputPath('output');
  const client = await startClient({
    clientName: 'cursor:vscode',
    config: { outputDir },
  });

  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  const result = await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { returnImage: true },
  });

  expect(result.content).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        data: expect.any(String),
        mimeType: 'image/jpeg',
        type: 'image',
      }),
      expect.objectContaining({
        text: expect.stringContaining('Screenshot viewport'),
        type: 'text',
      }),
    ])
  );
  expect(result.content.find(item => item.type === 'text')?.text).not.toContain('and save it as');
  expect(result.content.find(item => item.type === 'text')?.text).toContain('Ran Playwright code:');
  // Ensure no file was saved
  if (fs.existsSync(outputDir)) {
    const diskFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.png'));
    expect(diskFiles).toHaveLength(0);
  }
});

test('browser_take_screenshot (returnImage: false or undefined, clientName: cursor:vscode)', async ({ startClient, server }, testInfo) => {
  const outputDir = testInfo.outputPath('output');

  const client = await startClient({
    clientName: 'cursor:vscode',
    config: { outputDir },
  });

  expect(await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.HELLO_WORLD },
  })).toContainTextContent(`Navigate to http://localhost`);

  // Test with returnImage: false
  await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { returnImage: false, filename: 'cursor-test1.jpeg' }
  });
  let diskFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('cursor-test1.jpeg'));
  expect(diskFiles).toHaveLength(1);


  // Test with returnImage: undefined (default behavior)
  const resultUndefined = await client.callTool({
    name: 'browser_take_screenshot',
    arguments: { filename: 'cursor-test2.jpeg' /* returnImage is undefined */ },
  });
  expect(resultUndefined).toMatchObject({
    content: [
      {
        text: expect.stringContaining(`// Screenshot viewport and save it as`),
        type: 'text',
      },
    ],
  });
  const textContentCursor = resultUndefined.content.find(item => item.type === 'text')?.text;
  expect(textContentCursor).toContain('cursor-test2.jpeg'); // Check for the specific filename
  expect(textContentCursor).toContain('Ran Playwright code:');
  expect(textContentCursor).toContain('Page URL:');
  diskFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('cursor-test2.jpeg'));
  expect(diskFiles).toHaveLength(1);
});
