import type { PostCSSPlugin, RsbuildPlugin } from '@rsbuild/core';

// biome-ignore lint/suspicious/noEmptyInterface: empty interface
interface PluginTailwindCSSOptions {}

export const pluginTailwindCSS = (
  options: PluginTailwindCSSOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:tailwindcss',

  setup(api) {
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

              config.postcssOptions?.plugins?.push(
                '@tailwindcss/postcss' as unknown as PostCSSPlugin,
              );
            },
          },
        });
      },
    });
  },
});
