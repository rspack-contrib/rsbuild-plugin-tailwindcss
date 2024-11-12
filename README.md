# rsbuild-plugin-tailwindcss

An Rsbuild plugin to integrate with [Tailwind CSS](https://tailwindcss.com/) V3.

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-tailwindcss">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-tailwindcss?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-tailwindcss?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-tailwindcss.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Usage

Install:

```bash
npm add rsbuild-plugin-tailwindcss -D
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginTailwindCSS } from "rsbuild-plugin-tailwindcss";

export default {
  plugins: [pluginTailwindCSS()],
};
```

## License

[MIT](./LICENSE).
