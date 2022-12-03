import app from '../../server.js'
import request from 'supertest'
import { test } from '@jest/globals';
import * as IPFS from 'ipfs-http-client'
import OrbitDB from 'orbit-db'

const ipfs = IPFS.create('http://localhost:5001');

describe('GET /api/auth/wallets', () => {
	test('errors if missing param', async () => {
		const db = await OrbitDB.createInstance(ipfs)
		app.request.db = db
		app.request.db.wallets = await db.open('zdpuB1x7Ld2j5B8B6trBVCLrFb8cp527aZWQkCyZX6LsbyX5M/wallets', { indexBy: 'walletId' })
		app.request.db.content = await db.open('zdpuAurkvYnqvTzoochJ2u8Vp8vbsHQwyxFbChneDzscNM1jk/content', { indexBy: 'walletId' })
		await app.request.db.wallets.load();
		await app.request.db.content.load();

		await request(app)
			.get('/api/auth/wallets/')
			.set('Accept', 'application/json')
			.then((response) => {
				expect(response.statusCode).toBe(200);
			})
	});
});