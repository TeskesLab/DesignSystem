import { build } from 'tsup';

const showcase = process.argv.includes('--showcase');
await build(showcase ? {
  entry: { bundle: 'examples/library/main.tsx' },
  outDir: 'examples/library',
  format: ['iife'],
  platform: 'browser',
  outExtension: () => ({ js: '.js' }),
  target: 'es2020',
  noExternal: [/.*/],
  define: { 'process.env.NODE_ENV': '"development"' },
  clean: false,
} : {
  entry: ['web/src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  external: ['react', 'react-dom'],
  clean: true,
});
