import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '@lotta-llamas/models';
import { validate as uuidValidate } from 'uuid';

/**
 * GET /api/auth/posts
 * @summary Get all private posts in content that is in users wallet
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 401 Missing content ID
 * @throws {object} - 401 Content ID malformed
 * @throws {object} - 404 Content not found
 * @throws {object} - 401 Token not available in wallet
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Returns all applicable posts
 */

router.get('/', auth, async (req, res) => {
	const { contentId } = req.query

	if(!contentId) { return res.status(401).send({ error: 'Missing content ID' }) }

	if (!uuidValidate(contentId)) { return res.status(401).send({ error: 'Content ID malformed' })}

	const contentRecord = await db.Content.findByPk(contentId);

	if(!contentRecord) {
		return res.status(404).send({ error: 'Content not found' })
	}

	if(!req.assets.includes(contentRecord.token)) {
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		let posts
		if (contentId) {
			posts = await db.Post.findAll({
				where: { contentId, isDeleted: false },
				attributes: { exclude: ['isDeleted'] }
			})
		}
		req.logger.log({ level: 'info', message: `Address: ${req.address} requesting all posts`});
		res.status(200).send({ posts })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

/**
 * GET /api/auth/posts/:postId
 * @summary Get specific private post based on content in users wallet
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 401 Post ID malformed
 * @throws {object} - 401 Post not found
 * @throws {object} - 401 Token not available in wallet
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Returns single post
 */

router.get('/:postId', auth, async (req, res) => {
	try {
		const { postId } = req.params;

		if (!uuidValidate(postId)) { return res.status(401).send({ error: 'Post ID malformed' })}
	
		const posts = await db.Post.findByPk(postId, {
			include: [{
				model: db.Comment,
				as: 'comments',
				where: { isDeleted: false },
				attributes: { exclude: ['isDeleted'] },
				required: false
			}, 'Content'],
			attributes: { exclude: ['isDeleted'] }
		});

		if (posts === null || posts && posts.isDeleted) {
			return res.status(401).send({ error: 'Post not found' })
		}

		if(!req.assets.includes(posts.Content.token)) {
			res.status(401).send({ error: 'Token not available in wallet' })
		} else {
			req.logger.log({ level: 'info', message: `Address: ${req.address} requesting post: ${postId}`});
			res.status(200).send({ posts })
		}
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

/**
 * POST /api/auth/posts
 * @summary Get specific private post in content that is in users wallet
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 401 Missing contentId or malformed
 * @throws {object} - 401 Missing content
 * @throws {object} - 401 Missing title
 * @throws {object} - 401 Token not available in wallet
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Creates post and returns post record
 */

router.post('/', auth, async (req, res) => {
	const { title, text, contentId, isPublic } = req.body.post

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
			isPublic
		});
		req.logger.log({ level: 'info', message: `Address: ${req.address} created a post`});
		res.status(200).send({ post: createdRecord })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

/**
 * PUT /api/auth/posts/:postId
 * @summary Update post that belongs to wallet address
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 401 Missing content
 * @throws {object} - 401 Missing title
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Updates post and returns updated record
 */

router.put('/:postId', auth, async (req, res) => {
	if(!req.body.post.title) { return res.status(401).send({ error: 'Missing title' }) }
	if(!req.body.post.text) { return res.status(401).send({ error: 'Missing content' }) }
	try {
		const [row, content] = await db.Post.update({
			title: req.body.post.title,
			text: req.body.post.text,
			isPublic: req.body.post.isPublic
		}, {
			where: {
				id: req.params.postId,
				walletId: req.address,
				isDeleted: false
			},
			returning: true
		})
		req.logger.log({ level: 'info', message: `Address: ${req.address} updated post: ${req.params.postId}`});
		// TODO: make sure to remove isDeleted from response
		res.status(200).send({ post: content })
	} catch(error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

/**
 * DELETE /api/auth/posts/:postId
 * @summary Flip isDeleted flag on post, pertains to walletId
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 500 Post ID malformed
 * @throws {object} - 401 Post not found
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Status: OK
 */

router.delete('/:postId', auth, async(req, res) => {
	try {
		const { postId } = req.params;

		if (!uuidValidate(postId)) { return res.status(500).send({ error: 'Post ID malformed' })}

		const [row, content] = await db.Post.update({
			isDeleted: true,
		}, {
			where: {
				id: postId,
				walletId: req.address
			},
		})

		if (!row) {
			return res.status(401).send({ error: 'Post not found' })
		}

		req.logger.log({ level: 'info', message: `Address: ${req.address} deleted post: ${postId}`});
		res.status(200).send({ status: 'ok' })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

export default router;