import express from 'express';
const router = express.Router()
import jwt from 'jsonwebtoken'
import verifyWalletBodyParams from '../middleware/body.js'
import Wallet from '../classes/wallet.js'
import pkg from 'bitcore-lib';
const { Message } = pkg;

router.put('/validate-wallet', verifyWalletBodyParams, (req, res) => {
	try {
		const { address, signature, message } = req.body;
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

// TODO: Evaluate flow of this endpoint
router.put('/create-account', verifyWalletBodyParams, async (req, res) => {
	try {
		const { address, signature, message } = req.body;
		const verified = new Message(message).verify(address, signature);
		if (verified) {
			const wallet = new Wallet(req.db.wallets)
			await wallet.addWallet(address);
			const token = jwt.sign({ address }, 'shh');
			res.status(200).send({ token })
		} else {
			res.status(404).send({ error: 'Invalid Message' })
		}
	} catch (error) {
		res.status(500).send({ error });
	}
})

export default router;