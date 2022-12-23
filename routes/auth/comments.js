import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '../../../models/models/index.js'
import { validate as uuidValidate } from 'uuid';

// GET posts by content ID - NO TESTS
router.get('/', auth, async (req, res) => {
	const { contentId, postId } = req.query

	if(!contentId) { return res.status(401).send({ error: 'Missing contentId or malformed' }) }

	const contentRecord = await db.Content.findByPk(contentId);

	if(!req.assets.includes(contentRecord.token)) {
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		let comments
		if (true) {
			comments = await db.Comment.findAll({ where: { postId }})
		}

		res.status(200).send({ comments })
	} catch (error) {
		res.status(500).send({ error })
	}
})

// POST comment
router.post('/', auth, async (req, res) => {
	try {
		console.log(req.body.comment.postId)
		if (!uuidValidate(req.body.comment.postId)) {
			return res.status(400).send({ error: 'Post ID malformed' })
		}

		const post = await db.Post.findByPk(req.body.comment.postId, {
			include: ['Content'],
		});
	
		if (post === null) { return res.status(404).send({ error: 'Post not found' })}

		const { comment } = req.body.comment

		if(!req.assets.includes(post.Content.token)) { return res.status(401).send({ error: 'Token not available in wallet' }) }
		if(!comment) { return res.status(401).send({ error: 'No comment present' }) }

		const commentRecord = await post.createComment({
			comment,
			walletId: req.address
		});
	
		res.status(200).send({ comment: commentRecord })
	} catch (error) {
		res.status(500).send({ error })
	}
})

export default router;