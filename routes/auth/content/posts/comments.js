import express from 'express';
const router = express.Router()
import auth from '../../../../middleware/auth.js'
import db from '../../../../../models/models/index.js'
import Sequelize from 'sequelize';

// GET Comment
router.post('/', auth, async (req, res) => {

	const content = await db.Comment.findByPk();

	res.status(200).send({ content })
})

// PUT Creat content topic
router.post('/', auth, async (req, res) => {
	const tokens = req.assets ? req.assets : [];
	const { walletId, title, description, isPublic, token } = req.body

	if(!tokens.includes(token)) { res.status(401).send({ error: 'Token not available in wallet' }) }

	try {
		const content = await db.Content.create({
			walletId,
			title,
			description,
			isPublic,
			token
		});
	
		res.status(200).send({ content })
	} catch (error) {
		if (error.name === 'SequelizeUniqueConstraintError') {
			res.status(401).send({ error: error.errors[0].message })
		} else {
			res.status(500).send({ error })
		}
		
	}

})

export default router;