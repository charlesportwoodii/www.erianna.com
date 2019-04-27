const webpack = require('webpack');
const path = require('path');
const FileSystem = require("fs");

const CleanWebpackPlugin = require('clean-webpack-plugin');
const AssetsWebpackPlugin = require('assets-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const Visualizer = require('webpack-visualizer-plugin');
const configFile = path.resolve(__dirname, "../../config/config.yml");

const NODE_MODULES = path.resolve(__dirname, '../../node_modules');

module.exports = (env = { 'NODE_ENV': process.env.NODE_ENV }) => {
  return {
    mode: env.NODE_ENV,
    entry: {
      main: ['@babel/polyfill', path.resolve(__dirname, 'js/main.js')],
    },
    resolve: {
        extensions: ['.js', '.scss'],
        alias: {
            'style': path.resolve(__dirname, 'scss/main'),
            'img': path.resolve(__dirname, 'img'),
        }
    },
    devtool: env.NODE_ENV == 'production' ? 'cheap-module-source-map' : 'cheap-module-eval-source-map',
    output: {
      path: path.resolve(__dirname, 'static/'),
      filename: 'js/[name].[hash].js',
      publicPath: '/',
    },
    devServer: {
      public: '127.0.0.1:8080',
      port: 8080,
      host: '0.0.0.0',
      compress: true,
      hot: true,
      open: false,
      stats: 'normal',
      overlay: {
        errors: true,
        warnings: true,
      },
      disableHostCheck: true,
      watchOptions: {
          aggregateTimeout: 300,
          poll: 1000
      }
    },
    module: {
        rules: [
          {
            test: /\.json$/,
            loader: 'json-loader'
          },
          {
            test: /\.yaml$/,
            loader: 'yaml',
          },
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true
              }
            }
          },
          {
            test: /\.html$/,
            loader: 'html-loader'
          },
          {
            test: /\.(sa|sc|c)ss$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  hmr: process.env.DEBUG === true,
                  reloadAll: true
                },
              },
              'css-loader',
              'sass-loader'
            ],
          },

          {
              test: /\.twig$/,
              use: [{
                  loader: "file-loader"
              }]
          },
          {
            test: /\.(png|jpg|jpeg|gif|ico)$/,
            use: [
              {
                // loader: 'url-loader'
                loader: 'file-loader',
                options: {
                  name: './img/[name].[hash].[ext]'
                }
              }
            ]
          },
          {
            test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'file-loader',
            options: {
              name: 'fonts/[name].[hash].[ext]'
            }
          }]
      },
    plugins: [
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.HashedModuleIdsPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"'
      }),
      new webpack.LoaderOptionsPlugin({
        options: {
            postcss: function () {
                return [autoprefixer({browsers: ['last 3 versions', 'iOS 8']})];
            }
        }
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: '[name].[hash].styles.css',
        chunkFilename: '[id].[hash].css',
      }),

      new CleanWebpackPlugin({
        cleanAfterEveryBuildPatterns: ['static/*.*'],
        verbose: true,
        dry: false
      }),
      new OptimizeCssAssetsPlugin({
        cssProcessor: require('cssnano'),
        cssProcessorOptions: { discardComments: { removeAll: true }, reduceIdents: false },
        canPrint: true
      }),
      new AssetsWebpackPlugin({
        prettyPrint: false,
        fullPath: true,
        filename: 'data/assets/main/assets.json'
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: '../report.html'
      }),
      new Visualizer({
        filename: '../stats.html'
      })
    ]
  }
};