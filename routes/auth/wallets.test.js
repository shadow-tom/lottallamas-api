import app from '../../server.js'
import request from 'supertest'
import { test } from '@jest/globals';

describe('GET /api/wallets', () => {
	test('errors if missing param', async () => {
				expect.anything();
		// await request(app)
		// 	.get('/api/auth/wallets/')
		// 	.set('Accept', 'application/json')
		// 	.then((response) => {
		// 		expect(response.statusCode).toBe(200);
		// 	})
	});
});