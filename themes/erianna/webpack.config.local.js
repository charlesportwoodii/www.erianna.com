var webpack = require('webpack'),
    path = require('path'),
    config = require('./webpack.config.js'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    webpath = 'webpack-dev-server';

config.output.filename = 'js/[name].js';

config.plugins.push(
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin({ filename: 'css/[name].css', allChunks: true}),
);

module.exports = Object.assign(config, {
    devtool: 'source-map',
    devServer: {
        hot: true,
        disableHostCheck: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        },
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        }
    }
});
