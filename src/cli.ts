import { Command } from 'commander';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { SourceMapConsumer } from 'source-map';
import { parse } from 'stacktrace-parser';
import { ConsoleLogger, LogLevel } from './log';
import { version } from '../package.json';
import { debuglog } from 'util';

//#region copy from untildify
const homeDirectory = os.homedir();

function untildify(pathWithTilde: string) {
	if (typeof pathWithTilde !== 'string') {
		throw new TypeError(`Expected a string, got ${typeof pathWithTilde}`);
	}

	return homeDirectory ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory) : pathWithTilde;
}
//#endregion


interface IOptions {
	stack: string;
	map: string;
	verbose?: boolean;
}

const logger = new ConsoleLogger();

const program = new Command();
program.version(version, '-v, --version');

program
	.requiredOption('-s, --stack <string>', 'The error stack trace', (value) => {
		return value.split(String.raw`\n`).map(item => item.trim()).join('\n');
	})
	.requiredOption('-m, --map <string>', 'The source map directory', (value) => {
		return value.trim();
	})
	.option('--verbose', 'Verbose output', false);

program.parse(process.argv);
const options = program.opts<IOptions>();

if (options.verbose) {
	logger.setLevel(LogLevel.Debug);
}

const log = debuglog('stack-mapper');
log('options', options);

async function main() {
	const sourcemapDir = path.format(path.parse(untildify(path.normalize(options.map))));
	logger.debug('Source map directory:', sourcemapDir);

	//#region stack trace

	const stackTrace = parse(options.stack);
	logger.debug('parsed stack trace', stackTrace);

	//#endregion

	//#region source map

	const readSourceMaps = async (dir: string) => {
		try {
			const files = await fs.readdir(dir);
			const mapFiles = files.filter(file => path.extname(file) === '.map');

			logger.debug('Found source map files:');
			mapFiles.forEach(file => logger.debug(file));

			// Read contents of each .map file
			const sourceMapContents = await Promise.all(
				mapFiles.map(async (file) => {
					const filePath = path.join(dir, file);
					const content = await fs.readFile(filePath, 'utf-8');
					return { file, content };
				})
			);

			return sourceMapContents;
		} catch (error) {
			logger.error('readSourceMaps error', error);
			process.exit(1);
		}
	};


	const sourceMapContents = await readSourceMaps(sourcemapDir);
	const map = new Map<string, SourceMapConsumer>();
	await Promise.all(sourceMapContents.map(async ({ file, content }) => {
		const sourceMap = JSON.parse(content);
		const consumer = await new SourceMapConsumer(sourceMap);
		map.set(file.replace(/\.map$/, ''), consumer);
	})
	);

	const reconstructedStack = stackTrace.map(item => {
		const consumer = map.get(path.basename(item.file || ''));
		logger.debug('reconstructedStack item.file', item.file);
		if (consumer) {
			const position = consumer.originalPositionFor({
				line: item.lineNumber || 0,
				column: item.column || 0,
			});
			logger.debug('position: ', position);
			return {
				...item,
				file: position.source || item.file,
				lineNumber: position.line || item.lineNumber,
				column: position.column || item.column,
				methodName: position.name || item.methodName,
			};
		}
		return item;
	});

	// Construct the error message
	const errorMessage = `${reconstructedStack.map(item =>
		`\tat ${item.methodName || '<anonymous>'} (${item.file}:${item.lineNumber}:${item.column})`
	).join('\n')}`;

	logger.info('------- STACK TRACE -------');
	logger.info(`${options.stack.split('\n')[0] || 'Unknown error'}`);
	logger.info(errorMessage);

	//#endregion

	// Clean up source map consumers
	map.forEach(consumer => consumer.destroy());
}

main();
