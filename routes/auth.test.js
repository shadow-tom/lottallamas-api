import request from 'supertest'
import app from '../server.js'
import jwt from 'jsonwebtoken'

const wallet = {
	address: '1FBuCHMw5e5yTNKbf1eJq1bXZjoGaXeqwV',
	message: 'The man who stole the world',
	signature: 'IKsPcXMdQtIQtu2qjV34rtiwzv7uxo7eZp923u6/61iFJR7EzzeSBWdlp8OyjP3Ywk/8Kr4PvCLtrt0Z2MsXSiA='
}

describe('PUT /api/auth/validate-wallet', () => {
	const { address, message, signature } = wallet;
	test('errors if missing param', () => {
		return request(app)
			.put('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address,  signature })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Missing params');
			})
	});

	test('errors if invalid address', () => {
		return request(app)
			.put('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address: 'Fake123',  signature, message })
			.then((response) => {
				expect(response.statusCode).toBe(401);
				expect(JSON.parse(response.text).error).toBe('Invalid address');
			})
	});

	test('errors if invalid signature', () => {
		return request(app)
			.put('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address,  signature: 'Fake123', message })
			.then((response) => {
				expect(response.statusCode).toBe(500);
			})
	});

	test('errors if message is wrong', () => {
		return request(app)
			.put('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address, signature, message: 'Incorrect Message' })
			.then((response) => {
				expect(response.statusCode).toBe(404);
				expect(JSON.parse(response.text).error).toBe('Invalid Message');
			})
	});

	test('succeeds if correct params', () => {
		return request(app)
			.put('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address, signature, message })
			.then((response) => {
				const token = jwt.decode(JSON.parse(response.text).token);
				expect(response.statusCode).toBe(200);			
				expect(token["address"]).toBe(address);
			})
	});
});