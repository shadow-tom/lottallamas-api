const request = require("supertest");
const app = require("../server.js");

const wallet = {
	address: '1FBuCHMw5e5yTNKbf1eJq1bXZjoGaXeqwV',
	message: 'The man who stole the world',
	signature: 'IHcdszz688dGiPOP82v3nMQ3UQu6pdMPOV4tQV9Ok3jcaQo5e49rkUtxcd51SY7opxjawcI955FmoPajtnCTDpQ='
}

describe('PUT /api/auth/validate-wallet', () => {
	const { address, message, signature } = wallet;
	test('errors if missing param', () => {
		return request(app)
			.put('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address,  signature })
			.then((response) => {
				expect(response.statusCode).toBe(404);
				expect(JSON.parse(response.text).error).toBe('Missing params');
			})
	});

	test('errors if invalid address', () => {
		return request(app)
			.put('/api/auth/validate-wallet')
			.set('Accept', 'application/json')
			.send({ address: 'Fake123',  signature, message })
			.then((response) => {
				expect(response.statusCode).toBe(404);
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
				expect(response.statusCode).toBe(200);
				expect(JSON.parse(response.text).data).toBe('Valid Message');
			})
	});
});