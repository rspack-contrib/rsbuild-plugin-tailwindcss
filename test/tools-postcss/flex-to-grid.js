/**
 * @returns {import('postcss').AcceptedPlugin}
 */
export default function () {
  return {
    postcssPlugin: 'flex-to-grid',
    Declaration: {
      display(decl) {
        if (decl.value === 'flex') {
          decl.value = 'grid';
        }
      },
    },
  };
}
