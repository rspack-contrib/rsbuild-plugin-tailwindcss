import { defineConfig } from '@rsbuild/core';
import { webpackProvider } from '@rsbuild/webpack';
import { TailwindRspackPlugin } from 'rspack-plugin-tailwindcss';

export default defineConfig({
  provider: webpackProvider,
  plugins: [],
  output: {
    injectStyles: true,
  },
  tools: {
    lightningcssLoader: false,
    bundlerChain(chain, { CHAIN_ID }) {
      chain.module
        .rule(CHAIN_ID.RULE.CSS)
        .use('tailwindcss')
        .after(CHAIN_ID.USE.CSS)
        .loader(TailwindRspackPlugin.loader)
        .end();

      chain.plugin('tailwindcss').use(TailwindRspackPlugin);

      chain.cache(false);
    },
  },
});
