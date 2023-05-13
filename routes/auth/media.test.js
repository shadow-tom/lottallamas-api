import app from '../../server.js'
import request from 'supertest'
import db from '../../../models/index.js'
import { jest, test } from '@jest/globals';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "@aws-sdk/client-s3";
import process from 'node:process';
const env = process.env.NODE_ENV || 'development';
import config from '../../config/config.json' assert { type: 'json' };

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

const s3Client = new S3({
	forcePathStyle: false, // Configures to use subdomain/virtual calling format.
	endpoint: "https://nyc3.digitaloceanspaces.com",
	region: "us-east-1",
	rejectUnauthorized: false,
	credentials: {
		accessKeyId: config[env].s3.key,
		secretAccessKey: config[env].s3.secret
	}
});

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

describe('POST - Create image record and upload image', () => {
	test('500 - File not an image', async () => {
		const token1 = await getToken(testWallet1);
		await request(app)
			.post('/api/media/images')
			.set('Accept', 'image/png')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.attach('file', '/var/llamas/api/test-data/test.txt')
			.then((response) => {
				expect(response.statusCode).toBe(415);
				expect(JSON.parse(response.text).error).toBe('Only jpeg, png, gif, or webp files allowed, please')
			})
	})

	test('401 - Image too large', async () => {
		const token1 = await getToken(testWallet1);
		await request(app)
			.post('/api/media/images')
			.set('Accept', 'image/jpg')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.attach('file', '/var/llamas/api/test-data/16mb.jpg')
			.then((response) => {
				expect(response.statusCode).toBe(415);
				expect(JSON.parse(response.text).error).toBe('No images larger than 15MB, please')
			})
	})

	test('200 - Success', async () => {
		const token1 = await getToken(testWallet1);
		await request(app)
			.post('/api/media/images')
			.set('Accept', 'image/png')
			.set({'Authorization': token1, 'Address': testWallet1.address })
			.attach('file', '/var/llamas/api/test-data/llama.jpg')
			.then(async (response) => {
				expect(response.statusCode).toBe(200);
				expect(response.body.media.usage).toBe('post')
				expect(response.body.media.walletId).toBe(testWallet1.address)
				const bucketParams = {
					Bucket: 'lottallamas-media',
					Key: `images/${response.body.media.id}-${response.body.media.usage}`
				}
				await s3Client.send(new DeleteObjectCommand(bucketParams));

				await db.Media.destroy({
					where: { id: response.body.media.id }
				})
			})
	})
})
