import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '../../../models/models/index.js'

router.get('/:walletId', auth, async (req, res) => {
	try {
		// Get USER wallet
		res.status(200).send(wallets)
	} catch (e) {
		res.status(500).send(e)
	}
})

router.put('/:walletId', auth, async (req, res) => {
	try {
		// Update USER wallet
		res.status(200).send(wallets)
	} catch (e) {
		res.status(500).send(e)
	}
})


export default router;