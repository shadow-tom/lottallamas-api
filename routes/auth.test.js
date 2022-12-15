import app from '../server.js'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { test } from '@jest/globals';
import db from '../../models/models/index.js'

const wallet = {
	address: '1FBuCHMw5e5yTNKbf1eJq1bXZjoGaXeqwV',
	message: 'The man who stole the world',
	signature: 'IKsPcXMdQtIQtu2qjV34rtiwzv7uxo7eZp923u6/61iFJR7EzzeSBWdlp8OyjP3Ywk/8Kr4PvCLtrt0Z2MsXSiA=',
	nickName: 'Jimi'
}

const { address, message, signature, nickName } = wallet;

describe('POST - Login (Address, Message, Signature)', () => {
	test('errors if missing param', async () => {
		await request(app)
			.post('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address,  signature })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Missing params');
			})
	});

	test('errors if invalid address', async () => {
		await request(app)
			.post('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address: 'Fake123',  signature, message })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Invalid address');
			})
	});

	test('errors if invalid signature', async () => {
		await request(app)
			.post('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address,  signature: 'Fake123', message })
			.then((response) => {
				expect(response.statusCode).toBe(500);
			})
	});

	test('errors if message is wrong', async () => {
		await request(app)
			.post('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address, signature, message: 'Incorrect Message' })
			.then((response) => {
				expect(response.statusCode).toBe(404);
				expect(JSON.parse(response.text).error).toBe('Invalid Message');
			})
	});

	test('succeeds if correct params', async () => {
		await request(app)
			.post('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address, signature, message })
			.then((response) => {
				const token = jwt.decode(JSON.parse(response.text).token);
				expect(response.statusCode).toBe(200);			
				expect(token["address"]).toBe(address);
			})
	});
});

describe('POST - Create account', () => {
	afterAll(async() => {
		await db.Wallet.destroy({
			where: { id: wallet.address }
		})
	});

	test('succeeds if proper token is present', async () => {
		const { res } = await request(app)
			.post('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address, message, signature })
			.then((record) => {
				return record;
			})

		const token = JSON.parse(res.text).token;

		await request(app)
			.post('/api/auth/create-account')
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': address })
			.send({ nickName })
			.then((response) => {
				expect(response.body.account.id).toBe(wallet.address);
				expect(response.body.account.nickName).toBe(wallet.nickName);
				expect(response.statusCode).toBe(200);
			})
	});
})
