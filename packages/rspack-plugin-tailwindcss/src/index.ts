import path from 'node:path';
import type { Rspack } from '@rsbuild/core';

import { S_PLUGIN_TAILWINDCSS } from './symbol.js';

export class TailwindRspackPlugin {
  static loader = require.resolve('./loader.js');

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
      NormalModule.getCompilationHooks(compilation).loader.tap(
        this.name,
        (loaderContext) => {
          loaderContext[S_PLUGIN_TAILWINDCSS] = { moduleGraphCandidates };
        },
      );

      compilation.hooks.finishModules.tapPromise(this.name, async (modules) => {
        const ids = new Map<string, Rspack.Module>(
          Array.from(modules)
            .filter((module) => module.resource !== undefined)
            .map((module) => [module.resource!, module]),
        );

        await Promise.all(
          Array.from(ids.values())
            .filter((module) => module.resource?.endsWith('.css'))
            .map((module) => {
              const entryModules = new Set<string>();
              collectModules(compilation, module, entryModules);

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
  module: Rspack.Module,
  entryModules: Set<string>,
): void {
  const issuer = compilation.moduleGraph.getIssuer(module);

  if (issuer) {
    collectModules(compilation, issuer, entryModules);
  }

  if (module.modules) {
    for (const innerModule of module.modules) {
      collectModules(compilation, innerModule, entryModules);
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
