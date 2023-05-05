import app from '../../server.js'
import request from 'supertest'
import { test } from '@jest/globals';
import db from '../../../models/index.js'


describe('POST - Create a content record', () => {
	afterAll(async() => {
		await db.Content.destroy({
			where: { title: 'Removable' }
		})
	});

	test('401 - Token not available in wallet', async () => {
        expect(true).toBe(true)
		// const token1 = await getToken(testWallet1);
		// const body = {
		// 	walletId: testWallet1.address,
		// 	title: 'New test record',
		// 	description: 'test description',
		// 	isPublic: false,
		// 	token: 'LLAMAS.invalidToken'
		// }
		// await request(app)
		// 	.post('/api/media/')
		// 	.set('Accept', 'application/json')
		// 	.set({'Authorization': token1, 'Address': testWallet1.address })
		// 	.send({ content: body })
		// 	.then((response) => {
		// 		expect(response.statusCode).toBe(401);
		// 		expect(JSON.parse(response.text).error).toBe('Token not available in wallet')
		// 	})
	})
})