import express from 'express';
const router = express.Router()
import auth from '../../../middleware/auth.js'
import db from '../../../../models/models/index.js'
import Sequelize from 'sequelize';

// GET specific post
router.get('/:postId', auth, async (req, res) => {
	try {
		const tokens = req.assets ? req.assets : [];

		const { postId } = req.params;

		if (!postId) { res.status(401).send({ error: 'No content ID' })}
	
		const posts = await db.Post.findByPk(postId, {
			include: ['Comments'],
		});

		const content = await db.Content.findByPk(posts.contentId);

		if(!tokens.includes(content.token)) {
			res.status(401).send({ error: 'Token not available in wallet' })
		} else {
			res.status(200).send({ posts })
		}
	} catch (error) {
		res.status(500).send({ error })
	}
})

// POST Create post
router.post('/', auth, async (req, res) => {
	const tokens = req.assets ? req.assets : [];
	const { message, contentId } = req.body

	if(!contentId) { res.status(401).send({ error: 'Missing contentId' }) }
	if(!message) { res.status(401).send({ error: 'Missing message' }) }

	const contentRecord = await db.Content.findByPk(contentId);

	if(!tokens.includes(contentRecord.token)) {
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		const content = await db.Post.create({
			message,
			walletId: req.address,
			contentId,
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