'use strict';

// Modules
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ignoreFiles = new webpack.IgnorePlugin(/\.\/jquery-2.1.4.js$/);
var path = require('path');

var config = {
  context: path.resolve(__dirname, './client'),
  entry: {
    app: [
      'webpack-dev-server/client?http://localhost:3000/',
      path.resolve(__dirname, './client/index')
    ]
  },
  output: {
    // path: 'http://localhost:3000/',
    path: path.resolve(__dirname, './dist'),
    publicPath: 'http://localhost:3000/',
    filename: 'static/js/[name].bundle.js',
    // chunkFilename: 'static/js/[name].bundle.js'
  },
  devtool: 'eval',
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      },
      {
        test: /\.(jpg|jpeg|gif|png)/,
        loader: 'url-loader?name=static/images/[name].[ext]&limit=10240'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './client/index.html'),
      inject: 'body',
      chunks: ['app'],
      minify: false
    }),
    new webpack.HotModuleReplacementPlugin()
  ]
};

var compiler = webpack(config);

var serverOptions = {
  // contentBase: 'http://localhost:3000',
  publicPath: 'http://localhost:3000/',
  // publicPath: path.resolve(__dirname, './dist'),

  contentBase: './public',
  // hot: true,
  quiet: true,
  noInfo: true,
  inline: true,
  lazy: false,
  headers: { 'Access-Control-Allow-Origin': '*' },
  stats: {
    modules: false,
    cached: false,
    colors: true,
    chunk: false
  },
  proxy: {
    '/upload': {
      target: 'http://localhost:3002',
      secure: false,
      // bypass: function (req, res, proxyOptions) {
      //   if (req.headers.accept.indexOf('html') !== -1) {
      //     console.log('Skipping proxy for browser request.');
      //     return '/index.html';
      //   }
      // }
    }
  }
};

var server = new WebpackDevServer(compiler, serverOptions);

server.listen(3000, function(err) {
  if (err) throw err;

  console.log('webpack dev server is listening to port 3000. Open http://localhost:3000 to see the example.');
});

