import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import test, { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';

import { pluginTailwindCSS } from '../../src';
import { getRandomPort } from '../helper';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should dev with tailwind utilities in multiple entries', async ({
  page,
}) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        writeToDisk: true,
      },
      source: {
        entry: {
          a: './a.js',
          b: './b.js',
          c: './c.js',
          d: './d.js',
          e: './e.js',
        },
      },
      plugins: [pluginTailwindCSS()],
      server: {
        port: getRandomPort(),
      },
    },
  });

  const { server, urls } = await rsbuild.startDevServer();

  await page.goto(`${urls[0]}/a`);
  let style = await getStyle();
  expect(style.display).toBe('flex'); // flex
  expect(style.width).not.toBe('32px'); // w-8
  expect(style.paddingLeft).not.toBe('0'); // px-4
  expect(style.paddingRight).not.toBe('0'); // px-4
  expect(style.zIndex).not.toBe('20'); // z-20
  expect(style.justifyContent).not.toBe('flex-end'); // justify-end

  await page.goto(`${urls[0]}/b`);
  style = await getStyle();
  expect(style.display).not.toBe('flex'); // flex
  expect(style.width).toBe('32px'); // w-8
  expect(style.paddingLeft).not.toBe('0'); // px-4
  expect(style.paddingRight).not.toBe('0'); // px-4
  expect(style.zIndex).not.toBe('20'); // z-20
  expect(style.justifyContent).not.toBe('flex-end'); // justify-end

  await page.goto(`${urls[0]}/c`);
  style = await getStyle();
  expect(style.display).not.toBe('flex'); // flex
  expect(style.width).not.toBe('32px'); // w-8
  expect(style.paddingLeft).toBe('16px'); // px-4
  expect(style.paddingRight).toBe('16px'); // px-4
  expect(style.zIndex).not.toBe('20'); // z-20
  expect(style.justifyContent).not.toBe('flex-end'); // justify-end

  await page.goto(`${urls[0]}/d`);
  style = await getStyle();
  expect(style.display).not.toBe('flex'); // flex
  expect(style.width).not.toBe('32px'); // w-8
  expect(style.paddingLeft).not.toBe('0'); // px-4
  expect(style.paddingRight).not.toBe('0'); // px-4
  expect(style.zIndex).toBe('20'); // z-20
  expect(style.justifyContent).not.toBe('flex-end'); // justify-end

  await page.goto(`${urls[0]}/e`);
  style = await getStyle();
  expect(style.display).not.toBe('flex'); // flex
  expect(style.width).not.toBe('32px'); // w-8
  expect(style.paddingLeft).not.toBe('0'); // px-4
  expect(style.paddingRight).not.toBe('0'); // px-4
  expect(style.zIndex).not.toBe('20'); // z-20
  expect(style.justifyContent).toBe('flex-end'); // justify-end

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

test('should build with tailwind utilities in multiple entries', async ({
  page,
}) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          a: './a.js',
          b: './b.js',
          c: './c.js',
          d: './d.js',
          e: './e.js',
        },
      },
      plugins: [pluginTailwindCSS()],
      server: {
        port: getRandomPort(),
      },
    },
  });

  await rsbuild.build();
  const { server, urls } = await rsbuild.preview();

  await page.goto(`${urls[0]}/a`);
  let style = await getStyle();
  expect(style.display).toBe('flex'); // flex
  expect(style.width).not.toBe('32px'); // w-8
  expect(style.paddingLeft).not.toBe('0'); // px-4
  expect(style.paddingRight).not.toBe('0'); // px-4
  expect(style.zIndex).not.toBe('20'); // z-20
  expect(style.justifyContent).not.toBe('flex-end'); // justify-end

  await page.goto(`${urls[0]}/b`);
  style = await getStyle();
  expect(style.display).not.toBe('flex'); // flex
  expect(style.width).toBe('32px'); // w-8
  expect(style.paddingLeft).not.toBe('0'); // px-4
  expect(style.paddingRight).not.toBe('0'); // px-4
  expect(style.zIndex).not.toBe('20'); // z-20
  expect(style.justifyContent).not.toBe('flex-end'); // justify-end

  await page.goto(`${urls[0]}/c`);
  style = await getStyle();
  expect(style.display).not.toBe('flex'); // flex
  expect(style.width).not.toBe('32px'); // w-8
  expect(style.paddingLeft).toBe('16px'); // px-4
  expect(style.paddingRight).toBe('16px'); // px-4
  expect(style.zIndex).not.toBe('20'); // z-20
  expect(style.justifyContent).not.toBe('flex-end'); // justify-end

  await page.goto(`${urls[0]}/d`);
  style = await getStyle();
  expect(style.display).not.toBe('flex'); // flex
  expect(style.width).not.toBe('32px'); // w-8
  expect(style.paddingLeft).not.toBe('0'); // px-4
  expect(style.paddingRight).not.toBe('0'); // px-4
  expect(style.zIndex).toBe('20'); // z-20
  expect(style.justifyContent).not.toBe('flex-end'); // justify-end

  await page.goto(`${urls[0]}/e`);
  style = await getStyle();
  expect(style.display).not.toBe('flex'); // flex
  expect(style.width).not.toBe('32px'); // w-8
  expect(style.paddingLeft).not.toBe('0'); // px-4
  expect(style.paddingRight).not.toBe('0'); // px-4
  expect(style.zIndex).not.toBe('20'); // z-20
  expect(style.justifyContent).toBe('flex-end'); // justify-end

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
