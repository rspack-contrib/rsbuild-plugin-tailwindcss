import { existsSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { PostCSSLoaderOptions, Rspack } from '@rsbuild/core';

/**
 * The options for {@link TailwindRspackPlugin}.
 *
 * @public
 */
interface TailwindRspackPluginOptions {
  /**
   * The path to the configuration of Tailwind CSS.
   *
   * @example
   *
   * Use absolute path:
   *
   * ```js
   * // rspack.config.js
   * import path from 'node:path'
   * import { fileURLToPath } from 'node:url'
   *
   * import { TailwindRspackPlugin } from '@rsbuild/plugin-tailwindcss'
   *
   * const __dirname = path.dirname(fileURLToPath(import.meta.url))
   *
   * export default {
   *   plugins: [
   *     new TailwindRspackPlugin({
   *       config: path.resolve(__dirname, './config/tailwind.config.js'),
   *     }),
   *   ],
   * }
   * ```
   *
   * @example
   *
   * Use relative path:
   *
   * ```js
   * // rspack.config.js
   * import { TailwindRspackPlugin } from '@rsbuild/plugin-tailwindcss'
   *
   * export default {
   *   plugins: [
   *     new TailwindRspackPlugin({
   *       config: './config/tailwind.config.js',
   *     }),
   *   ],
   * }
   * ```
   */
  config: string;

  /**
   * The postcss options to be applied.
   *
   * @example
   *
   * Use `cssnano`:
   *
   * ```js
   * // rspack.config.js
   * import { TailwindRspackPlugin } from '@rsbuild/plugin-tailwindcss'
   *
   * export default {
   *   plugins: [
   *     new TailwindRspackPlugin({
   *       postcssOptions: {
   *         plugins: {
   *           cssnano: process.env['NODE_ENV'] === 'production' ? {} : false,
   *         },
   *       },
   *     }),
   *   ],
   * }
   * ```
   */
  postcssOptions: Exclude<
    PostCSSLoaderOptions['postcssOptions'],
    (loaderContext: Rspack.LoaderContext) => void
  >;
}

/**
 * The Rspack plugin for Tailwind integration.
 *
 * @public
 */
class TailwindRspackPlugin {
  constructor(private readonly options: TailwindRspackPluginOptions) {}

  /**
   * `defaultOptions` is the default options that the {@link TailwindRspackPlugin} uses.
   *
   * @public
   */
  static defaultOptions: Readonly<Required<TailwindRspackPluginOptions>> =
    Object.freeze<Required<TailwindRspackPluginOptions>>({
      config: 'tailwind.config.js',
      postcssOptions: {},
    });

  /**
   * The entry point of a Rspack plugin.
   * @param compiler - the Rspack compiler
   */
  apply(compiler: Rspack.Compiler): void {
    new TailwindRspackPluginImpl(compiler, this.options);
  }
}

export { TailwindRspackPlugin };
export type { TailwindRspackPluginOptions };

class TailwindRspackPluginImpl {
  name = 'TailwindRspackPlugin';

  constructor(
    private compiler: Rspack.Compiler,
    private options: TailwindRspackPluginOptions,
  ) {
    const { RawSource } = compiler.webpack.sources;
    compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
      compilation.hooks.processAssets.tapPromise(this.name, async () => {
        await Promise.all(
          [...compilation.entrypoints.entries()].map(
            async ([entryName, entrypoint]) => {
              const cssFiles = entrypoint
                .getFiles()
                .filter((file) => file.endsWith('.css'))
                .map((file) => compilation.getAsset(file))
                .filter((file) => !!file);

              if (cssFiles.length === 0) {
                // Ignore entrypoint without CSS files.
                return;
              }

              // collect all the modules corresponding to specific entry
              const entryModules = new Set<string>();

              for (const chunk of entrypoint.chunks) {
                const modules =
                  compilation.chunkGraph.getChunkModulesIterable(chunk);
                for (const module of modules) {
                  collectModules(module, entryModules);
                }
              }

              const [
                { default: postcss },
                { default: tailwindcss },
                configPath,
              ] = await Promise.all([
                import('postcss'),
                import('tailwindcss'),
                this.#prepareTailwindConfig(entryName, entryModules),
              ]);

              const postcssTransform = postcss([
                ...(options.postcssOptions?.plugins ?? []),
                // We use a config path to avoid performance issue of TailwindCSS
                // See: https://github.com/tailwindlabs/tailwindcss/issues/14229
                tailwindcss({
                  config: configPath,
                }),
              ]);

              // iterate all css asset in entry and inject entry modules into tailwind content
              await Promise.all(
                cssFiles.map(async (asset) => {
                  const content = asset.source.source();
                  // transform .css which contains tailwind mixin
                  // FIXME: add custom postcss config
                  const transformResult = await postcssTransform.process(
                    content,
                    { from: asset.name, ...options.postcssOptions },
                  );
                  // FIXME: add sourcemap support
                  compilation.updateAsset(
                    asset.name,
                    new RawSource(transformResult.css),
                  );
                }),
              );
            },
          ),
        );
      });
    });
  }

  async #prepareTailwindConfig(
    entryName: string,
    entryModules: Set<string>,
  ): Promise<string> {
    const userConfig = path.isAbsolute(this.options.config)
      ? this.options.config
      : // biome-ignore lint/style/noNonNullAssertion: should have context
        path.resolve(this.compiler.options.context!, this.options.config);

    const outputDir = DEBUG
      ? path.resolve(
          // biome-ignore lint/style/noNonNullAssertion: should have `output.path`
          this.compiler.options.output.path!,
          '.rsbuild',
          entryName,
        )
      : await mkdtemp(path.join(tmpdir(), entryName));

    const configPath = path.resolve(outputDir, 'tailwind.config.mjs');

    const content = JSON.stringify(Array.from(entryModules));

    await writeFile(
      configPath,
      existsSync(userConfig)
        ? `\
import config from '${pathToFileURL(userConfig)}'
export default {
  ...config,
  content: ${content}
}`
        : `\
export default {
  content: ${content}
}`,
    );

    return configPath;
  }
}

function collectModules(
  module: Rspack.Module,
  entryModules: Set<string>,
): void {
  if (module.modules) {
    for (const innerModule of module.modules) {
      collectModules(innerModule, entryModules);
    }
  } else if (module.resource) {
    entryModules.add(module.resource);
  }
}

const DEBUG = (function isDebug() {
  if (!process.env.DEBUG) {
    return false;
  }

  const values = process.env.DEBUG.toLocaleLowerCase().split(',');
  return ['rsbuild', 'rsbuild:tailwind', 'rsbuild:*', '*'].some((key) =>
    values.includes(key),
  );
})();
