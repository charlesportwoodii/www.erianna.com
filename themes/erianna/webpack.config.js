'use strict';
let webpack = require('webpack'),
    path = require('path'),
    autoprefixer = require('autoprefixer'),
    AssetsPlugin = require('assets-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: {
        main: [path.resolve(__dirname, 'js/main.js')]
    },
    output: {
        path: path.resolve(__dirname, 'static/'),
        publicPath: '/',
        filename: 'js/[name].[hash].js'
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                autoprefixer: false,
                                minimize: true
                            }
                        },
                        {loader: 'sass-loader'}
                    ]
                })
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2015'],
                        cacheDirectory: true
                    },
                }],
                exclude: /node_modules(?!\/webpack-dev-server)/
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(jpg|png)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: 'static/img/[name].[ext]'
                    }
                }]
            },
            {
                test: /\.svg$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000
                    }
                }]
            },
            {
                test: /\.woff$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'application/font-woff',
                        name: 'fonts/[name].[ext]'
                    }
                }]
            },
            {
                test: /\.woff2$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'application/font-woff2',
                        name: 'fonts/[name].[ext]'
                    }
                }]

            },
            {
                test: /\.(eot|ttf)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        'limit': 10000,
                        'name': 'fonts/[name].[ext]'
                    }
                }]
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.scss'],
        alias: {
            'style': path.resolve(__dirname, 'scss/main'),
            'img': path.resolve(__dirname, 'img'),
        }
    },
    plugins: [
        new ExtractTextPlugin({ filename: 'css/[name].[hash].css', allChunks: true}),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            output: {
                comments: false
            }
        }),
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
        new CleanWebpackPlugin(["static/js", "static/css"], {
            verbose: true,
            dry: false
        }),
        new AssetsPlugin({filename: 'data/assets/main/assets.json'})
    ]
};