
import app from '../server.js'
import request from 'supertest'
import { test } from '@jest/globals';
import db from '@lotta-llamas/models';

describe('GET - All Public Posts', () => {
	test('200 - Return empty if no records are public', async () => {
		return request(app)
			.get(`/api/public`)
			.set('Accept', 'application/json')
			.then(async (response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.posts.length).toBe(0);
			})
	});

	test('200 - Return Public Posts', async () => {
		await db.Post.update({ isPublic: true }, {
			where: {
				walletId: '14GRxZmNCLHo5Uknr2XYnGA61Hh9uMULXV'
			}
		})

		return request(app)
			.get(`/api/public`)
			.set('Accept', 'application/json')
			.then(async (response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.posts.length).toBe(1);
				await db.Post.update({ isPublic: false }, {
					where: {
						walletId: '14GRxZmNCLHo5Uknr2XYnGA61Hh9uMULXV'
					}
				})
			})
	});
})

describe('GET - Specific post', () => {
	test('400 - Post ID malformed', async () => {
		return request(app)
			.get('/api/public/123')
			.set('Accept', 'application/json')
			.then((response) => {
				expect(response.statusCode).toBe(400);
				expect(JSON.parse(response.text).error).toBe('Post ID malformed');
			})
	});

	test('404 - Post not found', async () => {
		const post = await db.Post.findOne();
		return request(app)
			.get(`/api/public/${post.id}`)
			.set('Accept', 'application/json')
			.then((response) => {
				expect(response.statusCode).toBe(404);
				expect(JSON.parse(response.text).error).toBe('Post not found');
			})
	});

	test('200 - Success', async () => {
		let post = await db.Post.findOne();
		post = await post.update({ isPublic: true })
		return request(app)
			.get(`/api/public/${post.id}`)
			.set('Accept', 'application/json')
			.then(async (response) => {
				expect(response.statusCode).toBe(200);
				await post.update({ isPublic: false });
			})
	});
});
