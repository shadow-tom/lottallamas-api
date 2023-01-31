import express from 'express';
const router = express.Router()
import jwt from 'jsonwebtoken'
import auth from '../middleware/auth.js'
import verifyWalletBodyParams from '../middleware/body.js'
import pkg from 'bitcore-lib';
const { Message } = pkg;
import https from 'https';

import db from '@lotta-llamas/models'

async function getWalletBalance(address) {
	return new Promise((resolve, reject) => {
		try {
			let data = ''
			https.get(`https://xchain.io/api/balances/${address}`, (res) => {
				res.on('data', chunk => { data += chunk }) 
				res.on('end', () => {
				   resolve(data);
				})
			})
		} catch(error) {
			reject(error)
		}
	})
}

router.post('/validate-wallet', verifyWalletBodyParams, async (req, res) => {
	try {
		const { address, signature, message } = req.body;
		const verified = new Message(message).verify(address, signature);
		if (verified) {
			const wallet = await getWalletBalance(address)
			const assets = JSON.parse(wallet).data
				.map((token) => token.asset_longname)
				.filter((token) => token ? token : false)
			// TODO: Make a real key, dingus.
			const token = jwt.sign({ address, assets }, 'shh');

			req.logger.log({ level: 'info', message: `Address: ${address} validated` });

			res.status(200).send({ token, address })
		} else {
			res.status(404).send({ error: 'Invalid Message' })
		}
	} catch(error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error });
	}
});

router.post('/create-account', auth, async (req, res) => {
	try {
		const account = await db.Wallet.create({
			id: req.address,
			nickName: req.body.nickName
		})

		res.status(200).send({ account })
	} catch (error) {
		res.status(500).send({ error });
	}
})

export default router;