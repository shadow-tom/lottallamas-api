import app from '../../server.js'
import request from 'supertest'
import { test } from '@jest/globals';
import db from '../../../models/models/index.js'

const testWallet1 = {
	address: '14GRxZmNCLHo5Uknr2XYnGA61Hh9uMULXV',
	message: 'The man who stole the world',
	signature: 'H4L8U9PWk0VyL12kJr7xZWbkTzHPEL4K2ByiR8KnfMhlI/XPsNLCgn9OzxTVujljO9hOMDff3e+fUyvbx4UYIAk=',
}

const testWallet2 = {
	address: '1FBuCHMw5e5yTNKbf1eJq1bXZjoGaXeqwV',
	message: 'The man who stole the world',
	signature: 'IKsPcXMdQtIQtu2qjV34rtiwzv7uxo7eZp923u6/61iFJR7EzzeSBWdlp8OyjP3Ywk/8Kr4PvCLtrt0Z2MsXSiA=',
}

function getToken(wallet) {
	const { address, message, signature } = wallet;
	return new Promise((resolve, reject) => {
		request(app)
			.post('/api/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address, message, signature })
			.then((record) => {
				resolve(record.body.token);
			})
	})
}

describe.only('POST /api/comments', () => {
	test('400 - Post ID malformed', async () => {
		const token1 = await getToken(testWallet1);
		return request(app)
			.post('/api/comments')
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.send({ comment: { postId: '123' }})
			.then((response) => {
				expect(response.statusCode).toBe(400);
				expect(JSON.parse(response.text).error).toBe('Post ID malformed');
			})
	});

	test('404 - Post not found', async () => {
		const token1 = await getToken(testWallet1);
		return request(app)
			.post('/api/comments')
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.send({ comment: { postId: '3fb32686-39a5-4a55-b33a-ea63f5f50fd0' }})
			.then((response) => {
				expect(response.statusCode).toBe(404);
				expect(JSON.parse(response.text).error).toBe('Post not found');
			})
	});

	test('401 - Token not available in wallet', async () => {
		const token = await getToken(testWallet2);
		const post = await db.Post.findOne({ where: { walletId: testWallet1.address }});
		return request(app)
			.post(`/api/comments`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet2.address })
			.send({ comment: { postId: post.id }})
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Token not available in wallet');
			})
	});

	test('401 - No comment present', async () => {
		const token = await getToken(testWallet1);
		const post = await db.Post.findOne({ where: { walletId: testWallet1.address }});
		return request(app)
			.post(`/api/comments`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.send({ comment: { postId: post.id, comment: null }})
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('No comment present');
			})
	});

	test('200 - Successfully adds comment record', async () => {
		const token = await getToken(testWallet1);
		const post = await db.Post.findOne({ where: { walletId: testWallet1.address } });
		return request(app)
			.post(`/api/comments`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.send({ comment: { postId: post.id, comment: 'A thoughtful comment' }})
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(JSON.parse(response.text).comment.comment).toBe('A thoughtful comment');
			})
	});
});