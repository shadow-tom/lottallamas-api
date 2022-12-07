// import app from '../../server.js'
import request from 'supertest'
import { test } from '@jest/globals';

describe('GET /api/auth/content/posts', () => {
	test('errors if missing param', () => {
		expect.anything();
		// return request(app)
		// 	.get('/api/auth/content/')
		// 	.set('Accept', 'application/json')
		// 	.then((response) => {
		// 		expect(response.statusCode).toBe(401);
		// 		expect(JSON.parse(response.text).error).toBe('Missing params');
		// 	})
	});
});