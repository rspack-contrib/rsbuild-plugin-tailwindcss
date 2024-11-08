import type { RsbuildPlugin } from '@rsbuild/core';

export type PluginTailwindCSSOptions = {
  config?: string;
};

export const pluginTailwindCSS = (
  options: PluginTailwindCSSOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:tailwindcss',

  setup() {
    console.log('Hello Rsbuild!', options);
  },
});
