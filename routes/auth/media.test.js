import app from '../../server.js'
import request from 'supertest'
import { jest, test } from '@jest/globals';
import db from '../../../models/index.js'
import { stat } from 'node:fs';

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

describe.only('POST - Create image record and upload image', () => {
	test('401 - File not an image', async () => {
		const token1 = await getToken(testWallet1);
		await request(app)
			.post('/api/media/')
			.set('Accept', 'image/png')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.attach('file', '/var/llamas/api/routes/auth/test.txt')
			.then((response) => {
				expect(response.statusCode).toBe(500);
				// console.log(response)
				// expect(JSON.parse(response.text).error).toBe('Token not available in wallet')
			})
	})
})