import { defineConfig } from '@rsbuild/core';
import { pluginTailwindCSS } from '../src';

export default defineConfig({
  plugins: [pluginTailwindCSS()],
});
