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

import { z } from 'zod';
import { defineTool, type ToolFactory } from './tool.js';
import { jsonSchema } from './utils.js';

const evaluate: ToolFactory = captureSnapshot => defineTool({
  capability: 'core',

  schema: {
    name: 'browser_evaluate_script',
    title: 'Evaluate script in browser',
    description: 'Evaluates a JavaScript script in the context of the current page and returns the result.',
    inputSchema: z.object({
      script: z.string().describe('The JavaScript code to evaluate.'),
      arg: jsonSchema.describe('An optional argument to pass to the script. This must be a JSON-serializable value.'),
    }),
    type: 'destructive',
  },

  handle: async (context, params) => {
    const tab = await context.ensureTab();
    const result = await tab.page.evaluate(params.script, params.arg);

    const code = [
      `// Evaluate script in browser`,
      `const result = await page.evaluate(${JSON.stringify(params.script)}, ${JSON.stringify(params.arg)});`,
    ];

    return {
      code,
      captureSnapshot,
      waitForNetwork: false,
      resultOverride: {
        content: [{
          contentType: 'application/json',
          content: JSON.stringify(result),
        }]
      }
    };
  },
});

export default (captureSnapshot: boolean) => [
  evaluate(captureSnapshot),
];
