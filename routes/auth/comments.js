import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '@lotta-llamas/models';
import { validate as uuidValidate } from 'uuid';

// GET posts by content ID - TODO: NO TESTS
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
		req.logger.log({ level: 'info', message: `Address: ${req.address} requesting all comments`});
		res.status(200).send({ comments })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

// POST Create comment
router.post('/', auth, async (req, res) => {
	try {
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
		req.logger.log({ level: 'info', message: `Address: ${req.address} creating comment`});
		res.status(200).send({ comment: commentRecord })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

// PUT Update comment
router.put('/:commentId', auth, async(req, res) => {
	try {
		const { commentId } = req.params;

		if (!uuidValidate(commentId)) { return res.status(500).send({ error: 'Comment ID malformed' })}

		const [row, record] = await db.Comment.update({
			comment: req.body.comment.comment
		}, {
			where: {
				id: commentId,
				walletId: req.address,
				isDeleted: false
			},
			returning: true,
		})

		if (!row) {
			return res.status(401).send({ error: 'Comment not found' })
		}

		req.logger.log({ level: 'info', message: `Address: ${req.address} update comment: ${commentId}`});
		// TODO: determine better way to do this.  Sequelize is not letting me exclude isDeleted from record
		const { id, comment, walletId, createdAt, updatedAt } = record[0];
		res.status(200).send({ comment: { id, comment, walletId, createdAt, updatedAt } })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

// DELETE comment
router.delete('/:commentId', auth, async(req, res) => {
	try {
		const { commentId } = req.params;

		if (!uuidValidate(commentId)) { return res.status(500).send({ error: 'Comment ID malformed' })}

		const [row, content] = await db.Comment.update({
			isDeleted: true,
		}, {
			where: {
				id: commentId,
				walletId: req.address
			},
		})

		if (!row) {
			return res.status(401).send({ error: 'Comment not found' })
		}

		req.logger.log({ level: 'info', message: `Address: ${req.address} deleted comment: ${commentId}`});
		res.status(200).send({ status: 'ok' })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

export default router;