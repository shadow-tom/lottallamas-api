
import app from '../server.js'
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

describe('GET - All Public Posts', () => {
	test('200 - Return empty if no records are public', async () => {
		const token = await getToken(testWallet1);

		return request(app)
			.get(`/api/public`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then(async (response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.posts.length).toBe(0);
			})
	});

	test('200 - Return Public Posts', async () => {
		await db.Post.update({ isPublic: true }, {
			where: {
				walletId:  testWallet1.address
			}
		})
		const token = await getToken(testWallet1);

		return request(app)
			.get(`/api/public`)
			.set('Accept', 'application/json')
			.set({'Authorization': token, 'Address': testWallet1.address })
			.then(async (response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.posts.length).toBe(1);
				await db.Post.update({ isPublic: false }, {
					where: {
						walletId:  testWallet1.address
					}
				})
			})
	});
})
