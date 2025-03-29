import pc from 'picocolors';

let i = 0;

export const logger = {
  // biome-ignore lint/suspicious/noExplicitAny: any
  log(...args: any[]): any {
    if (!DEBUG) return;

    i++;

    console.log(
      pc.red(`${i === 1 ? '\n' : ''}(${i}) `) +
        pc.bold(pc.green(`[${new Date().toISOString()}]`)),
      ...args,
    );
  },
};

const DEBUG = (function isDebug() {
  if (!process.env.DEBUG) {
    return false;
  }

  const values = process.env.DEBUG.toLocaleLowerCase().split(',');
  return ['rsbuild', 'rsbuild:tailwind', 'rsbuild:*', '*'].some((key) =>
    values.includes(key),
  );
})();
