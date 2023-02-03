import app from '../../server.js'
import request from 'supertest'
import { test } from '@jest/globals';
import db from '@lotta-llamas/models';

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

describe('POST /api/comments', () => {
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
			.then(async (response) => {
				const record = JSON.parse(response.text).comment;
				expect(response.statusCode).toBe(200);
				expect(record.comment).toBe('A thoughtful comment');
				// Clean up
				await db.Comment.destroy({
					where: { id: record.id }
				})
			})
	});
});

describe('DELETE /api/comments/:commentId', () => {
	test('500 - Comment ID malformed', async () => {
		const token = await getToken(testWallet1);
		return request(app)
			.delete('/api/comments/borked')
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then( async (response) => {
				expect(response.statusCode).toBe(500);
				expect(JSON.parse(response.text).error).toBe('Comment ID malformed');
			})
	});

	test('401 - Comment not found', async () => {
		const token = await getToken(testWallet1);
		return request(app)
			.delete('/api/comments/41a5d1cc-1de5-4d71-9d05-e92cc51f34bb')
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then( async (response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Comment not found');
			})
	});

	test('200 - Success', async () => {
		const token = await getToken(testWallet1);
		const comments = await db.Comment.findAll({
			where: { walletId: testWallet1.address, isDeleted: false }
		});

		const initialCommentsCount = comments.length;

		return request(app)
			.delete(`/api/comments/${comments[0].id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then( async (response) => {
				const currentCount = await db.Comment.findAll({
					where: { walletId: testWallet1.address, isDeleted: false }
				});
				expect(initialCommentsCount).toBe(currentCount.length + 1);
				expect(response.statusCode).toBe(200);
				// Clean up
				await db.Comment.update({
					isDeleted: false
				}, {
					where: { id: comments[0].id }
				})
			})
	});
})
