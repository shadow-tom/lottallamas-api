import express from 'express';
const router = express.Router()
import jwt from 'jsonwebtoken'
import verifyWalletBodyParams from '../middleware/body.js'

import pkg from 'bitcore-lib';
const { Message } = pkg;

router.put('/validate-wallet', verifyWalletBodyParams, (req, res) => {
	const { address, signature, message } = req.body;

	try {
		const verified = new Message(message).verify(address, signature);
		if (verified) {
			const token = jwt.sign({ address }, 'shh');
			res.status(200).send({ token })
		} else {
			res.status(404).send({ error: 'Invalid Message' })
		}
	} catch(error) {
		res.status(500).send({ error });
	}
});

router.get('/feed', auth, (req, res) => {
	res.send({ data: 'FEED' })
});

export default router;