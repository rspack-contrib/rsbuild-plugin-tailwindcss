import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { pluginTailwindCSS } from '../../src';
import { getRandomPort } from '../helper';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should dev with tailwind utilities', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginTailwindCSS()],
      server: {
        port: getRandomPort(),
      },
    },
  });

  const { server, urls } = await rsbuild.startDevServer();

  await page.goto(urls[0]);

  const display = await page.evaluate(() => {
    const el = document.getElementById('test');

    if (!el) {
      throw new Error('#test not found');
    }

    return window.getComputedStyle(el).getPropertyValue('display');
  });

  expect(display).toBe('flex');

  await server.close();
});

test('should build with tailwind utilities', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginTailwindCSS()],
    },
  });

  await rsbuild.build();
  const { server, urls } = await rsbuild.preview();

  await page.goto(urls[0]);

  const display = await page.evaluate(() => {
    const el = document.getElementById('test');

    if (!el) {
      throw new Error('#test not found');
    }

    return window.getComputedStyle(el).getPropertyValue('display');
  });

  expect(display).toBe('flex');

  await server.close();
});

test('should not generate tailwind.config.js in dist/', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginTailwindCSS()],
    },
  });

  await rsbuild.build();

  expect(existsSync(resolve(__dirname, './dist/.rsbuild'))).toBeFalsy();
});

test('should dev with nested entry', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          'nested/output/folder/bundle': resolve(__dirname, './src/index.js'),
        },
      },
      plugins: [pluginTailwindCSS()],
      server: {
        port: getRandomPort(),
      },
    },
  });

  const { server, urls } = await rsbuild.startDevServer();

  await page.goto(`${urls[0]}/nested/output/folder/bundle`);

  const display = await page.evaluate(() => {
    const el = document.getElementById('test');
    if (!el) {
      throw new Error('#test not found');
    }

    return window.getComputedStyle(el).getPropertyValue('display');
  });

  expect(display).toBe('flex');

  await server.close();
});
