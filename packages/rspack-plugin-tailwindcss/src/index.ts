import type { Rspack } from '@rsbuild/core';

import { S_PLUGIN_TAILWINDCSS } from './symbol.js';

export class TailwindRspackPlugin {
  static loader: string = require.resolve('./loader.js');

  apply(compiler: Rspack.Compiler): void {
    new TailwindRspackPluginImpl(compiler);
  }
}

class TailwindRspackPluginImpl {
  name = 'TailwindRspackPlugin';

  constructor(compiler: Rspack.Compiler) {
    const moduleGraphCandidates = new Map<string, Set<string>>();

    const { NormalModule } = compiler.webpack;

    compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
      let initial = true;

      NormalModule.getCompilationHooks(compilation).loader.tap(
        this.name,
        (loaderContext) => {
          Object.defineProperty(loaderContext, S_PLUGIN_TAILWINDCSS, {
            enumerable: true,
            value: { moduleGraphCandidates },
          });
        },
      );

      compilation.hooks.finishModules.tapPromise(this.name, async (modules) => {
        if (!initial) {
          return;
        }
        initial = false;

        const ids = new Map<string, Rspack.NormalModule>(
          Array.from(modules)
            .filter(
              (module): module is Rspack.NormalModule =>
                'resource' in module && module.resource !== undefined,
            )
            // biome-ignore lint/style/noNonNullAssertion: context should exist
            .map((module) => [module.resource!, module]),
        );

        await Promise.all(
          Array.from(ids.values())
            .filter(
              (module): module is Rspack.NormalModule =>
                'resource' in module && !!module.resource?.endsWith('.css'),
            )
            .map((module) => {
              const entryModules = new Set<string>();
              collectModules(compilation, module, entryModules);

              // biome-ignore lint/style/noNonNullAssertion: context should exist
              moduleGraphCandidates.set(module.resource!, entryModules);

              return new Promise<void>((resolve, reject) => {
                compilation.rebuildModule(module, (err, m) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve();
                });
              });
            }),
        );
      });
    });
  }
}

function collectModules(
  compilation: Rspack.Compilation,
  module: Rspack.Module | Rspack.ConcatenatedModule | Rspack.NormalModule,
  entryModules: Set<string>,
): void {
  const issuer = compilation.moduleGraph.getIssuer(module);

  if (issuer) {
    collectModules(compilation, issuer, entryModules);
  }

  if ('modules' in module && module.modules) {
    for (const innerModule of module.modules) {
      collectModules(compilation, innerModule, entryModules);
    }
  } else if ('resource' in module && module.resource) {
    // The value of `module.resource` maybe one of them:
    // 1. /w/a.js
    // 2. /w/a.js?component

    const resource: string =
      // rspack doesn't have the property `module.resourceResolveData.path` now.
      module.resource.split('?')[0];
    entryModules.add(resource);
  }
}
