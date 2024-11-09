import type { RsbuildPlugin } from '@rsbuild/core';

import { TailwindRspackPlugin } from './TailwindCSSRspackPlugin.js';

export type PluginTailwindCSSOptions = {
  /**
   * The path to the configuration of Tailwind CSS.
   *
   * @remarks
   *
   * The default value is `tailwind.config.js`.
   *
   * @example
   *
   * Use relative path:
   *
   * ```js
   * // rsbuild.config.ts
   * import { pluginTailwindCSS } from '@byted-lynx/plugin-tailwindcss'
   *
   * export default {
   *   plugins: [
   *     pluginTailwindCSS({
   *       config: './config/tailwind.config.js',
   *     }),
   *   ],
   * }
   * ```
   *
   * @example
   *
   * Use absolute path:
   *
   * ```js
   * // rsbuild.config.ts
   * import path from 'node:path'
   * import { fileURLToPath } from 'node:url'
   *
   * import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss'
   *
   * const __dirname = path.dirname(fileURLToPath(import.meta.url))
   *
   * export default {
   *   plugins: [
   *     pluginTailwindCSS({
   *       config: path.resolve(__dirname, './config/tailwind.config.js'),
   *     }),
   *   ],
   * }
   * ```
   */
  config?: string;
};

export const pluginTailwindCSS = (
  options: PluginTailwindCSSOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:tailwindcss',

  setup(api) {
    api.modifyBundlerChain({
      order: 'post',
      handler(chain) {
        chain
          .plugin('tailwindcss')
          .use(TailwindRspackPlugin, [
            { config: options.config ?? 'tailwind.config.js' },
          ]);
      },
    });
  },
});

export { TailwindRspackPlugin } from './TailwindCSSRspackPlugin.js';
