import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '@devups/lottallamas-models'
import { validate as uuidValidate } from 'uuid';

// GET posts by content ID
router.get('/', auth, async (req, res) => {
	const { contentId } = req.query

	if(!contentId) { return res.status(401).send({ error: 'Missing contentId or malformed' }) }

	const contentRecord = await db.Content.findByPk(contentId);

	if(!req.assets.includes(contentRecord.token)) {
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		let posts
		if (contentId) {
			posts = await db.Post.findAll({ where: { contentId }})
		}

		res.status(200).send({ posts })
	} catch (error) {
		res.status(500).send({ error })
	}
})


// GET specific post
router.get('/:postId', auth, async (req, res) => {
	try {
		const { postId } = req.params;

		if (!uuidValidate(postId)) { return res.status(401).send({ error: 'Post ID malformed' })}
	
		const posts = await db.Post.findByPk(postId, {
			include: ['comments', 'Content'],
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
	const { title, text, contentId } = req.body.post

	if(!contentId) { return res.status(401).send({ error: 'Missing contentId or malformed' }) }
	if(!text) { return res.status(401).send({ error: 'Missing content' }) }
	if(!title) { return res.status(401).send({ error: 'Missing title' }) }


	const contentRecord = await db.Content.findByPk(contentId);

	if(!req.assets.includes(contentRecord.token)) {
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		const createdRecord = await contentRecord.createPost({
			title,
			text,
			walletId: req.address,
			contentId,
		});
		res.status(200).send({ post: createdRecord })
	} catch (error) {
		res.status(500).send({ error })
	}
})

// PUT Update endpoint
router.put('/:postId', auth, async (req, res) => {
	if(!req.body.post.title) { return res.status(401).send({ error: 'Missing title' }) }
	if(!req.body.post.text) { return res.status(401).send({ error: 'Missing content' }) }
	try {
		const [row, content] = await db.Post.update({
			title: req.body.post.title,
			text: req.body.post.text
		}, {
			where: {
				id: req.params.postId,
				walletId: req.address
			},
			returning: true
		})
		res.status(200).send({ post: content })
	} catch(error) {
		res.status(500).send({ error })
	}
})

export default router;