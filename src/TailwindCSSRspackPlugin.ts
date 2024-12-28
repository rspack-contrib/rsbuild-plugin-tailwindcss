import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createFilter } from '@rollup/pluginutils';
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
   * import { TailwindRspackPlugin } from 'rsbuild-plugin-tailwindcss'
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
   * import { TailwindRspackPlugin } from 'rsbuild-plugin-tailwindcss'
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
   * The modules to be excluded.
   *
   * If {@link include} is omitted or empty,
   * all modules that do not match any of the {@link exclude} patterns will be included.
   * Otherwise, only modules that match one or more of the {@link include} patterns
   * and do not match any of the {@link exclude} patterns will be included.
   *
   * @example
   *
   * ```js
   * // rspack.config.js
   * import { TailwindRspackPlugin } from 'rsbuild-plugin-tailwindcss'
   *
   * export default {
   *   plugins: [
   *     new TailwindRspackPlugin({
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
   * // rspack.config.js
   * import { TailwindRspackPlugin } from 'rsbuild-plugin-tailwindcss'
   *
   * export default {
   *   plugins: [
   *     new TailwindRspackPlugin({
   *       include: [
   *         /\.[jt]sx?/,
   *       ],
   *     }),
   *   ],
   * }
   * ```
   */
  include?: FilterPattern | undefined;

  /**
   * The postcss options to be applied.
   *
   * @example
   *
   * Use `cssnano`:
   *
   * ```js
   * // rspack.config.js
   * import { TailwindRspackPlugin } from 'rsbuild-plugin-tailwindcss'
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

// From `@rollup/pluginutils`
/**
 * A valid `picomatch` glob pattern, or array of patterns.
 */
export type FilterPattern =
  | ReadonlyArray<string | RegExp>
  | string
  | RegExp
  | null;

/**
 * The Rspack plugin for Tailwind integration.
 *
 * @public
 */
class TailwindRspackPlugin {
  constructor(private readonly options: TailwindRspackPluginOptions) {}

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
    const filter = createFilter(options.include, options.exclude, {
      // biome-ignore lint/style/noNonNullAssertion: context should exist
      resolve: compiler.options.context!,
    });

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
                this.#prepareTailwindConfig(
                  entryName,
                  Array.from(entryModules).filter(filter),
                ),
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

  async ensureTempDir(entryName: string): Promise<string> {
    const prefix = path.join(tmpdir(), entryName);
    await mkdir(path.dirname(prefix), { recursive: true });
    return await mkdtemp(prefix);
  }

  async #prepareTailwindConfig(
    entryName: string,
    entryModules: Array<string>,
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
      : await this.ensureTempDir(entryName);

    if (DEBUG) {
      await mkdir(outputDir, { recursive: true });
    }

    const [configName, configContent] = await this.#generateTailwindConfig(
      userConfig,
      entryModules,
    );
    const configPath = path.resolve(outputDir, configName);

    await writeFile(configPath, configContent);

    return configPath;
  }

  async #resolveTailwindCSSVersion(): Promise<string> {
    const require = createRequire(import.meta.url);
    const pkgPath = require.resolve('tailwindcss/package.json');

    const content = await readFile(pkgPath, 'utf-8');

    const { version } = JSON.parse(content) as { version: string };

    return version;
  }

  async #generateTailwindConfig(
    userConfig: string,
    entryModules: string[],
  ): Promise<['tailwind.config.mjs' | 'tailwind.config.cjs', string]> {
    const version = await this.#resolveTailwindCSSVersion();

    const { default: satisfies } = await import(
      'semver/functions/satisfies.js'
    );

    const content = JSON.stringify(entryModules);
    if (satisfies(version, '^3.3.0')) {
      // Tailwind CSS support using ESM configuration in v3.3.0
      // See:
      //   - https://github.com/tailwindlabs/tailwindcss/releases/tag/v3.3.0
      //   - https://github.com/tailwindlabs/tailwindcss/pull/10785
      //   - https://github.com/rspack-contrib/rsbuild-plugin-tailwindcss/issues/18
      //
      // In this case, we provide an ESM configuration to support both ESM and CJS.
      return [
        'tailwind.config.mjs',
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
      ];
    }

    // Otherwise, we provide an CJS configuration since TailwindCSS would always use `require`.
    return [
      'tailwind.config.cjs',
      existsSync(userConfig)
        ? `\
const config = require(${JSON.stringify(userConfig)})
module.exports = {
  ...config,
  content: ${content}
}`
        : `\
module.exports = {
  content: ${content}
}`,
    ];
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
    // The value of `module.resource` maybe one of them:
    // 1. /w/a.js
    // 2. /w/a.js?component

    const resource: string =
      // rspack doesn't have the property `module.resourceResolveData.path` now.
      module.resource.split('?')[0];
    entryModules.add(resource);
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
