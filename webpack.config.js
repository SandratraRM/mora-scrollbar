const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'MoraScrollbar',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js', '.css'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ],
  },
  
  plugins: [
    new webpack.DefinePlugin({
      "process.env.DEBUG": process.env.DEBUG || false
    })
  ],
  devtool: 'source-map',
  devServer: {
    static: './dist',
    open: true,
    hot: true,
  },
};