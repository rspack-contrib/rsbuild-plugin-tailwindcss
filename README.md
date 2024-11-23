# rsbuild-plugin-tailwindcss

An Rsbuild plugin to integrate with [Tailwind CSS](https://tailwindcss.com/) V3.

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-tailwindcss">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-tailwindcss?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-tailwindcss?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-tailwindcss.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Why?

Tailwind CSS is able to remove unused CSS classes through [Content Configuration](https://tailwindcss.com/docs/content-configuration). However, its accuracy may be insufficient when:

- Using multiple entries
- Using a Tailwind CSS-based component library

This plugin uses the Rspack module graph to override the `content` configuration with imported modules, generating Tailwind CSS output _**based on usage**_.

## Usage

Install:

```bash
npm add tailwindcss@3 rsbuild-plugin-tailwindcss -D
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginTailwindCSS } from "rsbuild-plugin-tailwindcss";

export default {
  plugins: [pluginTailwindCSS()],
};
```

### Custom Tailwind CSS Configuration

Create a `tailwind.config.js` file at the root of the project:

```js
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    colors: {
      blue: "#1fb6ff",
      purple: "#7e5bef",
      pink: "#ff49db",
      orange: "#ff7849",
      green: "#13ce66",
      yellow: "#ffc82c",
      "gray-dark": "#273444",
      gray: "#8492a6",
      "gray-light": "#d3dce6",
    },
  },
};
```

This will be auto-loaded by Rsbuild and applied by `rsbuild-plugin-tailwindcss`.

> [!NOTE]
>
> You don't need to add `content` in the `tailwind.config.js`. `rsbuild-plugin-tailwindcss` will add the imported modules for you.

### Custom PostCSS Options

Create a `postcss.config.js` file at the root of the project:

```js
export default {
  plugins: {
    cssnano: process.env["NODE_ENV"] === "production" ? {} : false,
  },
};
```

> [!NOTE]
>
> You don't need to add `tailwindcss` in the `postcss.config.js`. `rsbuild-plugin-tailwindcss` will add the plugin for you.

Or use the [`tools.postcss`](https://rsbuild.dev/config/tools/postcss) option in `rsbuild.config.ts`.

## Options

### `config`

- Type: `string | undefined`
- Default: `tailwind.config.js`

The path to custom Tailwind CSS configuration. Could be a relative path from the root of the project or an absolute path.

- Example:

```js
// rsbuild.config.ts
import { pluginTailwindCSS } from "rsbuild-plugin-tailwindcss";

export default {
  plugins: [
    pluginTailwindCSS({
      config: "./config/tailwind.config.js",
    }),
  ],
};
```

### `exclude` / `include`

- Type: `ReadonlyArray<string | RegExp> | string | RegExp | null | undefined`
- Default: `undefined`

These two options are used to filter which module to be processed by Tailwind CSS using [`picomatch`](https://github.com/micromatch/picomatch#globbing-features) pattern.

If `include` is omitted or empty, all modules that do not match any of the `exclude` patterns will be included.
Otherwise, only modules that match one or more of the `include` patterns and do not match any of the `exclude` patterns will be included.

- Example:

Include all `.js`, `.jsx`, `.ts`, `.tsx` files but exclude files in `./src/store` and `node_modules`:

```js
// rsbuild.config.ts
import { pluginTailwindCSS } from "@byted-lynx/plugin-tailwindcss";

export default {
  plugins: [
    pluginTailwindCSS({
      include: /\.[jt]sx?/,
      exclude: ["./src/store/**", /[\\/]node_modules[\\/]/],
    }),
  ],
};
```

Note that `picomatch` patterns are very similar to [`minimatch`](https://github.com/isaacs/minimatch#readme) patterns, and in most use cases, they are interchangeable. If you have more specific pattern matching needs, you can view [this comparison table](https://github.com/micromatch/picomatch#library-comparisons) to learn more about where the libraries differ.

## Credits

Thanks to:

- [Tailwind CSS V4](https://tailwindcss.com/blog/tailwindcss-v4-alpha) for the idea of purge CSS by module graph.
- The [purge-tailwind-plugin](https://github.com/hardfist/purge-tailwind-plugin) created by [@hardfist](https://github.com/hardfist) for the implementation of the Rspack plugin.
- The [Rollup](https://github.com/rollup/) project created by [Rich Harris](https://github.com/Rich-Harris) and maintained by [Lukas Taegert-Atkinson](https://github.com/lukastaegert) for the implementaion of `exclude` and `include`.

## License

[MIT](./LICENSE).
