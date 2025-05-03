import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import test, { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';

import { pluginTailwindCSS } from '../../src';
import { getRandomPort } from '../helper';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should build with multiple configs for different entries', async ({
  page,
}) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: './src/index.js',
          main: './src/main.js',
          default: './src/default.js',
        },
      },
      plugins: [
        pluginTailwindCSS({
          multipleConfig: {
            index: './config/tailwind.index.config.js',
            main: './config/tailwind.main.config.js',
          },
        }),
      ],
      server: {
        port: getRandomPort(),
      },
    },
  });

  await rsbuild.build();

  const { server, urls } = await rsbuild.startDevServer();

  await page.goto(`${urls[0]}/index`);
  let style = await getStyle();
  expect(style.backgroundColor).toBe('rgb(0, 85, 255)');

  await page.goto(`${urls[0]}/main`);
  style = await getStyle();
  expect(style.backgroundColor).toBe('rgb(255, 85, 0)');

  await page.goto(`${urls[0]}/default`);
  style = await getStyle();
  expect(style.backgroundColor).toBe('rgb(85, 255, 0)');

  await server.close();

  async function getStyle() {
    return await page.evaluate(() => {
      const el = document.getElementById('test');

      if (!el) {
        throw new Error('#test not found');
      }

      return window.getComputedStyle(el);
    });
  }
});
