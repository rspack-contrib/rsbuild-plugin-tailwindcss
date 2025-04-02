import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginTailwindCSS } from '../../src';
import { getRandomPort } from '../helper';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should dev with resource query on rspack', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: resolve(__dirname, './src/index.js?entry'),
        },
      },
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

test('should build with resource query on rspack', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: resolve(__dirname, './src/index.js?entry'),
        },
      },
      server: {
        port: getRandomPort(),
      },
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

test('should dev with resource query on webpack', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      provider: webpackProvider,
      source: {
        entry: {
          index: resolve(__dirname, './src/index.js?entry'),
        },
      },
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

test('should build with resource query on webpack', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          index: resolve(__dirname, './src/index.js?entry'),
        },
      },
      server: {
        port: getRandomPort(),
      },
      provider: webpackProvider,
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
