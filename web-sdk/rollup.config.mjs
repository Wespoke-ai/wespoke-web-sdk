import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

const isProd = process.env.NODE_ENV === 'production';

const baseConfig = {
  input: 'src/index.ts',
  external: ['livekit-client'],
  plugins: [
    json(),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      sourceMap: true
    })
  ]
};

export default [
  // UMD build (for <script> tags)
  {
    ...baseConfig,
    output: {
      file: 'dist/wespoke.umd.js',
      format: 'umd',
      name: 'Wespoke',
      sourcemap: true,
      globals: {
        'livekit-client': 'LivekitClient'
      }
    },
    plugins: [
      ...baseConfig.plugins,
      isProd && terser()
    ].filter(Boolean)
  },
  // ESM build (for modern bundlers)
  {
    ...baseConfig,
    output: {
      file: 'dist/wespoke.esm.js',
      format: 'esm',
      sourcemap: true
    }
  },
  // CommonJS build (for Node.js)
  {
    ...baseConfig,
    output: {
      file: 'dist/wespoke.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    }
  }
];
