import express from 'express';
import cors from 'cors';
const app = express()

import * as IPFS from 'ipfs-http-client'

import OrbitDB from 'orbit-db'

import auth from './routes/auth.js';
import wallets from './routes/auth/wallets.js'
import content from './routes/auth/content.js'
import posts from './routes/auth/content/posts.js'
import comments from './routes/auth/content/posts/comments.js'

const port = 3100

app.use(cors({
    origin: '*'
}));

if (process.env.NODE_ENV !== 'test') {
	// Create IPFS/Orbit instance.  I placed this outside of the
	// test suite as it was causing tests to hang
	const ipfs = IPFS.create('http://localhost:5001');
	const db = await OrbitDB.createInstance(ipfs)
	
	// TODO: Dry up this middleware
	app.use(async (req, res, next) => {
		req.db = db
		req.db.wallets = await db.open('zdpuB1x7Ld2j5B8B6trBVCLrFb8cp527aZWQkCyZX6LsbyX5M/wallets', { indexBy: 'walletId' })
		req.db.content = await db.open('zdpuAurkvYnqvTzoochJ2u8Vp8vbsHQwyxFbChneDzscNM1jk/content', { indexBy: 'walletId' })
		await req.db.wallets.load();
		await req.db.content.load();
		next();
	})
}

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use('/api/auth', auth);
app.use('/api/auth/wallets', wallets);
app.use('/api/auth/content', content);
app.use('/api/auth/content/posts', posts);
app.use('/api/auth/content/posts/comments', comments);

if (process.env.NODE_ENV !== 'test') {
	app.listen(port, () => {
		console.log(`Example app listening on port ${port}`)
	})
}

export default app;