import express from 'express';
const router = express.Router()
import Wallet from '../../classes/wallet.js'
import auth from '../../middleware/auth.js'

router.get('/', async (req, res) => {
	try {
		const wallet = new Wallet(req.db.wallets)
		const wallets = await wallet.getWallets()
		res.status(200).send(wallets)
	} catch (error) {
		console.log(error)
		res.status(500).send({ error })
	}
})

router.get('/:walletId', async (req, res) => {
	try {
		const wallet = new Wallet(req.db.wallets)
		const wallets = await wallet.getWallet(req.params.walletId);
		res.status(200).send(wallets)
	} catch (e) {
		res.status(500).send(e)
	}
})

export default router;