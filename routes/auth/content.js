import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '../../../models/models/index.js'
import Sequelize from 'sequelize';

// GET all content that pertains to tokens within your wallet
router.get('/', auth, async (req, res) => {
	const tokens = req.assets ? req.assets : [];

	const content = await db.Content.findAll({ 
		where: {
			token: {
				[Sequelize.Op.or]: tokens
			}
		}
	});

	res.status(200).send({ content })
})

// GET content posts that pertain to a contentId
router.get('/:contentId', auth, async (req, res) => {
	const { contentId } = req.params;

	if (!contentId) {
		return res.status(401).send({ error: 'No content ID' })
	}

	const posts = await db.Content.findByPk(contentId, {
		include: ['Posts'],
	});

	res.status(200).send({ posts })
})

// PUT Create content topic
router.post('/', auth, async (req, res) => {
	const tokens = req.assets ? req.assets : [];
	const { title, description, isPublic, token } = req.body

	if(!tokens.includes(token)) { 
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		const content = await db.Content.create({
			walletId: req.address,
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