import app from '../../server.js'
import request from 'supertest'
import { test } from '@jest/globals';
import db from '@lotta-llamas/models';

const testWallet1 = {
	address: '14GRxZmNCLHo5Uknr2XYnGA61Hh9uMULXV',
	message: 'The man who stole the world',
	signature: 'H1w16tBXgWiBiOKVOO6ZsD085JbEeLtOeE0bdR06E+9fEl8vpLpMUjXQFE/knJ2cccrVCYaVvcFO3UIvaeZqB6M=',
}

const testWallet2 = {
	address: '1FBuCHMw5e5yTNKbf1eJq1bXZjoGaXeqwV',
	message: 'The man who stole the world',
	signature: 'IHOyein3654Qulxc+/Fddr5WWtMAgwCcqXCGMBnsragzXqO1BcpygeAueDSaXBF0cqYb3eiGrvPcpaFXmOCguVQ=',
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

describe('GET - All posts by contentId(query param)', () => {
	test('401 - Missing contentId', async () => {
		const token = await getToken(testWallet1);

		return request(app)
			.get(`/api/posts`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Missing content ID');
			})
	});

	test('401 - Content ID malformed', async () => {
		const token = await getToken(testWallet1);

		return request(app)
			.get(`/api/posts?contentId=123`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Content ID malformed');
			})
	});

	test('404 - Content not found', async () => {
		const token = await getToken(testWallet1);

		return request(app)
			.get(`/api/posts?contentId=49dec1ac-01fe-4de8-81db-2b3dd30e352c`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(404);
				expect(JSON.parse(response.text).error).toBe('Content not found');
			})
	});

	test('401 - Token not available in wallet', async () => {
		const token = await getToken(testWallet1);
		const content = await db.Content.findOne({ where: { walletId: testWallet2.address }});

		return request(app)
			.get(`/api/posts?contentId=${content.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Token not available in wallet');
			})
	});

	test('200 - Success', async () => {
		const token = await getToken(testWallet1);
		const content = await db.Content.findOne({ where: { walletId: testWallet1.address }});

		return request(app)
			.get(`/api/posts?contentId=${content.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.posts.length).toBe(1);
			})
	});
});

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
			.send({ post: { title, text }})
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
			.send({ post: { contentId: content.id, text: null }})
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
			.send({ post: { title: null, contentId: content.id, text: 'test content' }})
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
			.send({ post: { title, text, contentId: contentId.id }})
			.then(async (response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.post.title).toBe(title);
				expect(response.body.post.text).toBe(text);

				// Clean up
				await db.Post.destroy({
					where: { id: response.body.post.id }
				})
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
			.send({ post: { title, text: null, contentId: contentId.id } })
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
			.send({ post: { title, text, contentId }})
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.post[0].title).toBe(title);
				expect(response.body.post[0].text).toBe(text);
			})
	})
})

describe('DELETE - Delete post', () => {
	test('500 -Post ID malformed', async () => {
		const token = await getToken(testWallet1);

		return request(app)
			.delete('/api/posts/malformed-id')
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(500);
				expect(JSON.parse(response.text).error).toBe('Post ID malformed');
			})
	})

	test('401 - Post not found', async () => {
		const token = await getToken(testWallet1);

		return request(app)
			.delete('/api/posts/83dca716-be5d-4aeb-8a07-087857a5efd7')
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Post not found');
			})
	})

	test('200 - Success', async () => {
		const token = await getToken(testWallet1);
		const post = await db.Post.findOne({ where: { walletId: testWallet1.address }})

		return request(app)
			.delete(`/api/posts/${post.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then(async (response) => {
				expect(response.statusCode).toBe(200);
				// Clean up
				await db.Post.update({
					isDeleted: false
				}, {
					where: { id: post.id }
				})
			})
	})
})