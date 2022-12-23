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

describe('GET - Specific post', () => {
	test('401 - Post ID malformed', async () => {
		const token = await getToken(testWallet1);

		return request(app)
			.get('/api/posts/123')
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Post ID malformed');
			})
	});

	test('401 - Token not available in wallet', async () => {
		const token = await getToken(testWallet2);
		const post = await db.Post.findOne({ where: { walletId: testWallet1.address }});

		return request(app)
			.get(`/api/posts/${post.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet2.address })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Token not available in wallet');
			})
	});

	test('200 - Success', async () => {
		const post = await db.Post.findOne({ where: { walletId: testWallet1.address }});
		const token = await getToken(testWallet1);

		return request(app)
			.get(`/api/posts/${post.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.posts.Content.token).toBe('LLAMAS.test1');
			})
	});
});

describe('POST - Create new post', () => {
	test('401 - Missing contentId', async () => {

		const title = 'A new test post'
		const text = 'New test post'
		const token = await getToken(testWallet1);

		return request(app)
			.post(`/api/posts/`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.send({ title, text })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Missing contentId or malformed');
			})
	})

	test('401 - Missing message', async () => {
		const token = await getToken(testWallet1);
		const content = await db.Content.findOne({ where: { walletId: testWallet1.address }});

		return request(app)
			.post(`/api/posts/`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.send({ contentId: content.id, text: null })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Missing content');
			})
	})

	test('401 - Missing title', async () => {
		const token = await getToken(testWallet1);
		const content = await db.Content.findOne({ where: { walletId: testWallet1.address }});

		return request(app)
			.post(`/api/posts/`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.send({ title: null, contentId: content.id, text: 'test content' })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Missing title');
			})
	})

	test('200 - Success', async () => {
		const token = await getToken(testWallet1);
		const title = 'A test title';
		const text = 'New test post'
		const contentId = await db.Content.findOne({ where: { walletId: testWallet1.address }});

		return request(app)
			.post(`/api/posts/`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.send({ title, text, contentId: contentId.id })
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.content.title).toBe(title);
				expect(response.body.content.text).toBe(text);
			})
	})
})

describe('PUT - Update post', () => {
	test('401 - Missing text', async () => {
		const token = await getToken(testWallet1);
		const title = 'A test title'
		const post = await db.Post.findOne({ where: { walletId: testWallet1.address }})
		const contentId = await db.Content.findOne({ where: { walletId: testWallet1.address }});

		return request(app)
			.put(`/api/posts/${post.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.send({ title, text: null, contentId: contentId.id })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Missing content');
			})
	})

	test('200 - Success', async () => {
		const token = await getToken(testWallet1);
		const title = 'A test title'
		const text = 'Updated post'
		const post = await db.Post.findOne({ where: { walletId: testWallet1.address }})
		const contentId = await db.Content.findOne({ where: { walletId: testWallet1.address }});

		return request(app)
			.put(`/api/posts/${post.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.send({ title, text, contentId })
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.content[0].text).toBe(text);
			})
	})
})