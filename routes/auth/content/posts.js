import express from 'express';
const router = express.Router()
import auth from '../../../middleware/auth.js'
import db from '../../../../models/models/index.js'
import { validate as uuidValidate } from 'uuid';

// GET specific post
router.get('/:postId', auth, async (req, res) => {
	try {
		const { postId } = req.params;

		if (!uuidValidate(postId)) { return res.status(401).send({ error: 'Post ID malformed' })}
	
		const posts = await db.Post.findByPk(postId, {
			include: ['Comments', 'Content'],
		});

		if(!req.assets.includes(posts.Content.token)) {
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
	const { message, contentId } = req.body

	if(!contentId) { return res.status(401).send({ error: 'Missing contentId or malformed' }) }
	if(!message) { return res.status(401).send({ error: 'Missing message' }) }

	const contentRecord = await db.Content.findByPk(contentId);

	if(!req.assets.includes(contentRecord.token)) {
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		const content = await contentRecord.createPost({
			message,
			walletId: req.address,
			contentId,
		});
		res.status(200).send({ content })
	} catch (error) {
		res.status(500).send({ error })
	}
})

// PUT Update endpoint
router.put('/:postId', auth, async (req, res) => {
	if(!req.body.message) { return res.status(401).send({ error: 'Missing message' }) }
	try {
		const [row, content] = await db.Post.update({
			message: req.body.message
		}, {
			where: {
				id: req.params.postId,
				walletId: req.address
			},
			returning: true
		})
		res.status(200).send({ content })
	} catch(error) {
		res.status(500).send({ error })
	}
})

export default router;