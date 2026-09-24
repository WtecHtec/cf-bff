import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Hello World user worker', () => {
	describe('request for /message', () => {
		it('/ responds with "Hello, World!" (unit style)', async () => {
			const request = new Request('http://example.com/message');
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});

		it('responds with "Hello, World!" (integration style)', async () => {
			const request = new Request('http://example.com/message');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});
	});

	describe('request for /random', () => {
		it('/ responds with a random UUID (unit style)', async () => {
			const request = new Request('http://example.com/random');
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
		});

		it('responds with a random UUID (integration style)', async () => {
			const request = new Request('http://example.com/random');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
		});
	});

	describe('TypeSafe proxy route /typesafe', () => {
		it('handles OPTIONS preflight with CORS headers', async () => {
			const request = new Request('http://example.com/typesafe', { method: 'OPTIONS' });
			const response = await SELF.fetch(request);
			expect([200, 204]).toContain(response.status);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
		});

		it('returns 405 for GET request', async () => {
			const request = new Request('http://example.com/typesafe', { method: 'GET' });
			const response = await SELF.fetch(request);
			expect(response.status).toBe(405);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});

		it('returns 401 when API Key is missing', async () => {
			const request = new Request('http://example.com/typesafe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ state: 'test' }),
			});
			const response = await SELF.fetch(request);
			expect(response.status).toBe(401);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			const json = await response.json();
			expect(json.error).toMatch(/API Key/);
		});
	});
});
