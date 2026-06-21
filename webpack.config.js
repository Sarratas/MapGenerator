const path = require('node:path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

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
                exclude: /node_modules/,
                use: {
                    loader: 'swc-loader',
                    options: {
                        jsc: {
                            parser: { syntax: 'typescript' },
                            target: 'es2020',
                        },
                        // Emit ES modules so webpack can tree-shake.
                        module: { type: 'es6' },
                    },
                },
            },
            {
                test: /\.(s*)css$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },
    plugins: [
        // swc transpiles without type-checking; run tsc in a separate process so type errors still fail the build.
        // Use the build-only config (app sources, no tests) so the dev-server overlay isn't driven by test types;
        // `npm run typecheck` covers tests via the root tsconfig.
        new ForkTsCheckerWebpackPlugin({
            typescript: { configFile: 'tsconfig.build.json' },
        }),
    ],
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
