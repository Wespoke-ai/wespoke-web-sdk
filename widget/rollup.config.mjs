import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import postcss from 'rollup-plugin-postcss';

const isProd = process.env.NODE_ENV === 'production';

const baseConfig = {
  input: 'src/index.ts',
  external: ['@wespoke/web-sdk'],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      preventAssignment: true
    }),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      include: /node_modules/
    }),
    postcss({
      extract: true,
      minimize: isProd,
      sourceMap: true
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      sourceMap: true
    })
  ]
};

export default [
  // UMD build (for <script> tags and CDN)
  {
    ...baseConfig,
    output: {
      file: 'dist/wespoke-widget.umd.js',
      format: 'umd',
      name: 'WespokeWidget',
      sourcemap: true,
      globals: {
        '@wespoke/web-sdk': 'Wespoke',
        'react': 'React',
        'react-dom': 'ReactDOM',
        'react-dom/client': 'ReactDOM'
      }
    },
    external: ['@wespoke/web-sdk', 'react', 'react-dom', 'react-dom/client'],
    plugins: [
      ...baseConfig.plugins,
      isProd && terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ].filter(Boolean)
  },
  // ESM build (for modern bundlers)
  {
    ...baseConfig,
    output: {
      file: 'dist/wespoke-widget.esm.js',
      format: 'esm',
      sourcemap: true
    },
    external: ['@wespoke/web-sdk', 'react', 'react-dom', 'react-dom/client']
  },
  // CommonJS build (for Node.js)
  {
    ...baseConfig,
    output: {
      file: 'dist/wespoke-widget.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external: ['@wespoke/web-sdk', 'react', 'react-dom', 'react-dom/client']
  }
];
