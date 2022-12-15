import express from 'express';
const router = express.Router()
import auth from '../../../../middleware/auth.js'
import db from '../../../../../models/models/index.js'
import { validate as uuidValidate } from 'uuid';

// POST comment
router.post('/:postId', auth, async (req, res) => {
	try {
		if (!uuidValidate(req.params.postId)) {
			return res.status(400).send({ error: 'Post ID malformed' })
		}

		const post = await db.Post.findByPk(req.params.postId, {
			include: ['Content'],
		});
	
		if (post === null) { return res.status(404).send({ error: 'Post not found' })}

		const { comment } = req.body

		if(!req.assets.includes(post.Content.token)) { return res.status(401).send({ error: 'Token not available in wallet' }) }
		if(!comment) { return res.status(401).send({ error: 'No comment present' }) }

		const content = await post.createComment({
			comment,
			walletId: req.address
		});
	
		res.status(200).send({ content })
	} catch (error) {
		res.status(500).send({ error })
	}
})

export default router;