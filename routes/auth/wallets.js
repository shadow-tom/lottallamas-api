import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '@lotta-llamas/models'

router.get('/:walletId', auth, async (req, res, next) => {
	try {
		// Get USER wallet
		res.status(200).send(wallets)
	} catch (e) {
		next(new Error(error))
	}
})

router.put('/:walletId', auth, async (req, res, next) => {
	try {
		// Update USER wallet
		res.status(200).send(wallets)
	} catch (e) {
		next(new Error(error))
	}
})


export default router;