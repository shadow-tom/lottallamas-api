import express from 'express';
const router = express.Router()
import db from '@lotta-llamas/models';
import { validate as uuidValidate } from 'uuid';

/**
 * GET /api/public
 * @summary Get all public posts
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @return {object} - 200 Retruns all public posts
 * @throws {object} - 500 Server Error
 */

// TODO: Query params and probably limit count.  This should be more of a feed.
router.get('/', async (req, res, next) => {
	try {
		const posts = await db.Post.findAll({
			where: { isPublic: true, isDeleted: false },
			attributes: { exclude: ['isDeleted'] }
		})

		return res.status(200).send({ posts })
	} catch(error) {
		next(new Error(error))
	}
})

/**
 * GET /api/public/:postId
 * @summary Get specific public post
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 400 Post ID malformed
 * @throws {object} - 404 Post not found
 * @throws {object} - 401 Token not available in wallet
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Returns single post
 */

router.get('/:postId', async (req, res, next) => {
	try {
		const { postId } = req.params;

		if (!uuidValidate(postId)) { return res.status(400).send({ error: 'Post ID malformed' })}
	
		const post = await db.Post.findByPk(postId, {
			include: [{
				model: db.Comment,
				as: 'comments',
				where: {
					isDeleted: false
				},
				attributes: { exclude: ['isDeleted'] },
				required: false
			}, 'Content'],
			attributes: { exclude: ['isDeleted'] }
		});

		if (post === null || post && post.isDeleted || !post.isPublic) {
			return res.status(404).send({ error: 'Post not found' })
		}

		req.logger.log({ level: 'info', message: `Address: ${req.address} requesting post: ${postId}`});
		res.status(200).send({ post })

	} catch (error) {
		next(new Error(error))
	}
})

export default router;