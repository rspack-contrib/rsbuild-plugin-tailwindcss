import path from 'node:path';

import type { Rspack } from '@rsbuild/core';
import { Features, compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';

import { S_PLUGIN_TAILWINDCSS } from './symbol.js';

export type LoaderOptions = {};

export default async function loader(
  this: Rspack.LoaderContext<LoaderOptions> & {
    [S_PLUGIN_TAILWINDCSS]: {
      moduleGraphCandidates: Map<string, Set<string>>;
    };
  },
  source: string,
) {
  const { moduleGraphCandidates } = this[S_PLUGIN_TAILWINDCSS];

  const set = moduleGraphCandidates.get(this.resourcePath);

  if (!set) {
    return source;
  }

  const compiler = await compile(source, {
    base: this.context ?? '/',
    onDependency: (dependency) => this.addDependency(dependency),
    shouldRewriteUrls: true,
  });

  if (
    !(
      compiler.features &
      (Features.AtApply |
        Features.JsPluginCompat |
        Features.ThemeFunction |
        Features.Utilities)
    )
  ) {
    return source;
  }

  const scanner = new Scanner({});
  const candidates = scanner.scanFiles(
    Array.from(set).map((id) => ({
      file: id,
      extension: getExtension(id),
    })),
  );

  return compiler.build(candidates);
}

function getExtension(id: string) {
  const [filename] = id.split('?', 2);
  return path.extname(filename).slice(1);
}
