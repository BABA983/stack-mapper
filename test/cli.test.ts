import { suite, test } from "vitest";
import { exec } from 'child_process';
import { promisify } from 'util';
import assert from "assert";

const execPromise = promisify(exec);

suite('CLI Tests', () => {
	test('should execute the CLI command successfully', async () => {
		console.log(process.cwd());
		const { stdout, stderr } = await execPromise(`node ./bin/cli.js -s "Error: test
    at a (index-D-Siy5fH.js:1:2408)
    at index-D-Siy5fH.js:17:3" -m "./test/fixtures"`);
		const result = stdout.split('\n');
		assert.strictEqual(result.shift(), '------- STACK TRACE -------');
		assert.strictEqual(result.shift(), 'Error: test');
		assert.strictEqual(result.shift(), '\tat a (../../src/counter.ts:3:14)');
		assert.strictEqual(result.shift(), '\tat setupCounter (../../src/main.ts:24:3)');
		assert.strictEqual(result.shift(), '');
	});
});