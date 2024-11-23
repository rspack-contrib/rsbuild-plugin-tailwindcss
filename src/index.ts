import type {
  PostCSSLoaderOptions,
  RsbuildPlugin,
  Rspack,
} from '@rsbuild/core';

import { TailwindRspackPlugin } from './TailwindCSSRspackPlugin.js';
import type { FilterPattern } from './TailwindCSSRspackPlugin.js';

export type { FilterPattern };

export interface PluginTailwindCSSOptions {
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
   * import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss'
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

  /**
   * The modules to be excluded using `picomatch` patterns.
   *
   * If {@link include} is omitted or empty,
   * all modules that do not match any of the {@link exclude} patterns will be included.
   * Otherwise, only modules that match one or more of the {@link include} patterns
   * and do not match any of the {@link exclude} patterns will be included.
   *
   * @example
   *
   * ```js
   * // rsbuild.config.ts
   * import { pluginTailwindCSS } from '@byted-lynx/plugin-tailwindcss'
   *
   * export default {
   *   plugins: [
   *     pluginTailwindCSS({
   *       exclude: [
   *         './src/store/**',
   *         /[\\/]node_modules[\\/]/,
   *       ],
   *     }),
   *   ],
   * }
   * ```
   */
  exclude?: FilterPattern | undefined;

  /**
   * The modules to be included using `picomatch` patterns.
   *
   * If {@link include} is omitted or empty,
   * all modules that do not match any of the {@link exclude} patterns will be included.
   * Otherwise, only modules that match one or more of the {@link include} patterns
   * and do not match any of the {@link exclude} patterns will be included.
   *
   * @example
   *
   * ```js
   * // rsbuild.config.ts
   * import { pluginTailwindCSS } from '@byted-lynx/plugin-tailwindcss'
   *
   * export default {
   *   plugins: [
   *     pluginTailwindCSS({
   *       include: [
   *         /\.[jt]sx?/,
   *       ],
   *     }),
   *   ],
   * }
   * ```
   */
  include?: FilterPattern | undefined;
}

export const pluginTailwindCSS = (
  options: PluginTailwindCSSOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:tailwindcss',

  setup(api) {
    let postcssOptions: Exclude<
      PostCSSLoaderOptions['postcssOptions'],
      (loaderContext: Rspack.LoaderContext) => void
    >;

    api.modifyRsbuildConfig({
      order: 'post',
      handler(config, { mergeRsbuildConfig }) {
        return mergeRsbuildConfig(config, {
          tools: {
            postcss(config) {
              if (typeof config.postcssOptions === 'function') {
                throw new Error(
                  'pluginTailwindCSS does not support using `tools.postcss` as function',
                );
              }
              if (config.postcssOptions) {
                // Remove `tailwindcss` from `postcssOptions`
                // to avoid `@tailwind` being transformed by `postcss-loader`.
                config.postcssOptions.plugins =
                  config.postcssOptions.plugins?.filter(
                    (p) =>
                      'postcssPlugin' in p && p.postcssPlugin !== 'tailwindcss',
                  ) ?? [];
                postcssOptions = config.postcssOptions;
              }
            },
          },
        });
      },
    });

    api.modifyBundlerChain({
      order: 'post',
      handler(chain) {
        chain.plugin('tailwindcss').use(TailwindRspackPlugin, [
          {
            config: options.config ?? 'tailwind.config.js',
            include: options.include,
            exclude: options.exclude,
            postcssOptions,
          },
        ]);
      },
    });
  },
});

export { TailwindRspackPlugin } from './TailwindCSSRspackPlugin.js';
