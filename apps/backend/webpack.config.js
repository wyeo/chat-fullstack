const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  output: {
    path: join(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      '@backend/auth': join(__dirname, 'src/app/auth'),
      '@backend/users': join(__dirname, 'src/app/users'),
      '@backend/messages': join(__dirname, 'src/app/messages'),
      '@backend/app': join(__dirname, 'src/app'),
      '@backend': join(__dirname, 'src'),
    },
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
    new webpack.BannerPlugin({
      banner: `
        if (typeof globalThis.crypto === 'undefined') {
          const crypto = require('crypto');
          globalThis.crypto = crypto.webcrypto || crypto;
          if (!globalThis.crypto.randomUUID && crypto.randomUUID) {
            globalThis.crypto.randomUUID = crypto.randomUUID.bind(crypto);
          }
        }
      `,
      raw: true,
      entryOnly: true,
    }),
  ],
};
