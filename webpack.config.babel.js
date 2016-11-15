
import { resolve } from 'path';
import webpack from 'webpack';

export default (webpackEnv) => {
	const { env } = process;

	env.NODE_ENV = env.NODE_ENV || (webpackEnv ? 'production' : 'development');

	const port = env.PORT || 3000;
	const DEV = env.NODE_ENV === 'development';
	const srcDir = resolve(__dirname, 'src');
	const exampleDir = resolve(__dirname, 'example');

	const config = {
		devtool: DEV ? 'eval-source-map' : 'none',
		cache: DEV,
		entry: DEV ? './example' : './src',
		output: {
			filename: 'react-wormhole-hoc.js',
			path: resolve(__dirname, DEV ? 'example' : 'dist'),
			library: 'ReactWormholeHoc',
			libraryTarget: 'umd',
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					include: [srcDir, exampleDir],
					loader: 'babel',
					options: {
						presets: [
							['es2015', { modules: false }],
							'react',
							'stage-0',
						],
						plugins: [
							'transform-decorators-legacy',
						],
						cacheDirectory: true,
						babelrc: false,
					},
				},
			],
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
			}),
		],
		resolve: {
			modules: [srcDir, 'node_modules'],
			extensions: ['.js'],
		},
		devServer: {
			port,
			publicPath: '/',
			contentBase: './example',
			historyApiFallback: {
				disableDotRule: true
			},
			stats: {
				chunkModules: false,
				colors: true,
			},
		},
	};

	if (!DEV) {
		config.externals = { react: 'React' };
	}

	return config;
};
