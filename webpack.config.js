const path = require('node:path');

module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    devServer: {
        // Serve the project root (index.html, sprite.png, favicon.ico) as static files.
        static: {
            directory: path.resolve(__dirname),
            watch: true,
        },
        // Keep the compiled bundle under /dist/ so index.html's <script src="dist/bundle.js"> resolves.
        devMiddleware: {
            publicPath: '/dist/',
        },
        open: true,
        hot: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(s*)css$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
    },
    mode: 'development',
};
