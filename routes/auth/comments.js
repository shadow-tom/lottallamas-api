import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '@lotta-llamas/models';
import { validate as uuidValidate } from 'uuid';

/**
 * GET /api/auth/comments
 * @summary - Get all comments, per postID, per contentId
 * @param {object} req - The Express request object
 * @param {array} req.assets - List of available assets within wallet
 * @param {string} req.query.contentId - UUID for content
 * @param {string} req.query.postId - UUID for post
 * @param {object} res - The Express response object
 * @throws {object} - 401 Missing contentId or malformed
 * @throws {object} - 401 Missing postId or malformed
 * @throws {object} - 401 Token not available in wallet
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Returns all comments that pertain to the post
 */

router.get('/', auth, async (req, res) => {
	const { contentId, postId } = req.query

	if(!contentId) { return res.status(401).send({ error: 'Missing contentId or malformed' }) }
	if(!postId) { return res.status(401).send({ error: 'Missing postId or malformed' }) }

	const contentRecord = await db.Content.findByPk(contentId);

	if(!req.assets.includes(contentRecord.token)) {
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		const comments = await db.Comment.findAll({ 
			where: { postId, isDeleted: false },
			attributes: { exclude: ['isDeleted'] },
			order: [['createdAt', 'DESC']]
		})

		req.logger.log({ level: 'info', message: `Address: ${req.address} requesting all comments`});
		res.status(200).send({ comments })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

/**
 * POST /api/auth/comments
 * @summary - Create comment, per postId
 * @param {object} req - The Express request object
 * @param {array} req.assets - List of available assets within wallet
 * @param {object} req.body.comment - comment object
 * @param {object} res - The Express response object
 * @throws {object} - 401 Post ID malformed
 * @throws {object} - 401 Post not found
 * @throws {object} - 401 Token not available in wallet
 * @throws {object} - 401 No comment present
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Creates comment and returns comment record
 */

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

/**
 * PUT /api/auth/comments/:commentId
 * @summary Update comment, per walletId
 * @param {object} req The Express request object
 * @param {object} req.params.commentId UUID for comment
 * @param {object} res The Express response object
 * @throws {object} - 500 Comment ID malformed
 * @throws {object} - 401 Comment not found
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Updates comment and returns updated record
 */

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

/**
 * DELETE /api/auth/comments/:commentId
 * @summary Delete comment, per walletID
 * @param {object} req The Express request object
 * @param {object} req.params.commentId UUID for comment
 * @param {object} res The Express response object
 * @throws {object} - 500 Comment ID malformed
 * @throws {object} - 401 Comment not found
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Status: OK
 */

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