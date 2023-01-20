import app from '../../server.js'
import request from 'supertest'
import { test } from '@jest/globals';
import db from '@lotta-llamas/models';

const testWallet1 = {
	address: '14GRxZmNCLHo5Uknr2XYnGA61Hh9uMULXV',
	message: 'The man who stole the world',
	signature: 'H+qepF5uloLuG+BwczXOEArBCfn90gol0kRHKggXqXUGJ7IGvNABYMfWNkegCFmZ5W8bvPwQNDe56FZTlSv/sFc=',
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

describe('GET - All content records', () => {
	test('200 - Success', async () => {
		const token1 = await getToken(testWallet1);
		await request(app)
			.get('/api/content')
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.content.length).toBe(1);
				expect(response.body.content[0].token).toBe('LLAMAS.test1')
			})
		
		const token2 = await getToken(testWallet2);
		await request(app)
			.get('/api/content')
			.set('Accept', 'application/json')
			.set({'Authorization': token2, 'Address': testWallet2.address })
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.content.length).toBe(1);
				expect(response.body.content[0].token).toBe('LLAMAS.test2')
			})
	});
});

describe('GET - Singular content record', () => {
	test('returns 400 - Content ID malformed', async ()=> {
		const token1 = await getToken(testWallet1);
		await request(app)
			.get(`/api/content/123`)
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(400);
				expect(JSON.parse(response.text).error).toBe('Content ID malformed')
			})
	})

	test('returns 401 - Token not available in wallet', async ()=> {
		const content = await db.Content.findOne({ where: { walletId: testWallet1.address }});

		const token2 = await getToken(testWallet2);
		await request(app)
			.get(`/api/content/${content.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token2, 'Address': testWallet2.address })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Token not available in wallet')
			})
	})

	test('200 - Success', async () => {
		const content1 = await db.Content.findOne({ where: { walletId: testWallet1.address }});
		const content2 = await db.Content.findOne({ where: { walletId: testWallet2.address }});
		const token1 = await getToken(testWallet1);
		const token2 = await getToken(testWallet2);

		await request(app)
			.get(`/api/content/${content1.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.content.token).toBe('LLAMAS.test1')
			})

		await request(app)
			.get(`/api/content/${content2.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token2, 'Address': testWallet2.address })
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.content.token).toBe('LLAMAS.test2')
			})
	});
});

describe('POST - Create a content record', () => {
	afterAll(async() => {
		await db.Content.destroy({
			where: { title: 'Removable' }
		})
	});

	test('401 - Token not available in wallet', async () => {
		const token1 = await getToken(testWallet1);
		const body = {
			walletId: testWallet1.address,
			title: 'New test record',
			description: 'test description',
			isPublic: false,
			token: 'LLAMAS.invalidToken'
		}
		await request(app)
			.post('/api/content/')
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.send(body)
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Token not available in wallet')
			})
	})

	test('401 - Token not available in wallet', async () => {
		const token1 = await getToken(testWallet1);
		const body = {
			walletId: testWallet1.address,
			title: 'New test record',
			description: 'test description',
			isPublic: false,
			token: 'LLAMAS.test1'
		}
		await request(app)
			.post('/api/content/')
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.send(body)
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Token not available in wallet')
			})
	})

	test('401 - Token not available in wallet', async () => {
		const token1 = await getToken(testWallet1);
		const body = {
			walletId: testWallet1.address,
			title: 'New test record',
			description: 'test description',
			isPublic: false,
			token: 'LLAMAS.test2'
		}
		await request(app)
			.post('/api/content/')
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.send(body)
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Token not available in wallet')
			})
	})

	test('200 - Success', async () => {
		const token1 = await getToken(testWallet1);
		const body = {
			walletId: testWallet1.address,
			title: 'Removable',
			description: 'test description',
			isPublic: false,
			token: 'LLAMAS.test3'
		}
		await request(app)
			.post('/api/content/')
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.send(body)
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.content.token).toBe('LLAMAS.test3');
			})
	})
})

describe('PUT - Update a content record', () => {
	afterAll(async() => {
		await db.Content.update({
			title: 'Content Test#1',
			description: 'Content#1'
		} ,{
			where: { title: 'test title' }
		})
	});

	test('401 - Missing title', async () => {
		const token1 = await getToken(testWallet1);
		const content = await db.Content.findOne({ where: { walletId: testWallet1.address }})
		const body = {
			description: 'test description',
			isPublic: false,
		}
		await request(app)
			.put(`/api/content/${content.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.send(body)
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Missing title')
			})
	})

	test('200 - Success', async () => {
		const token1 = await getToken(testWallet1);
		const content = await db.Content.findOne({ where: { walletId: testWallet1.address }})

		const body = {
			title: 'test title',
			description: 'test description',
			isPublic: false,
		}
		await request(app)
			.put(`/api/content/${content.id}`)
			.set('Accept', 'application/json')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.send(body)
			.then((response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.content[0].title).toBe('test title');
			})
	})
})