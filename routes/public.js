import express from 'express';
const router = express.Router()
import db from '@lotta-llamas/models';

/**
 * GET /api/public
 * @summary Get all public posts
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @return {object} - 200 Retruns all public posts
 * @throws {object} - 500 Server Error
 */

// TODO: Query params and probably limit count.  This should be more of a feed.
router.get('/', async (req, res) => {
	try {
		const posts = await db.Post.findAll({
			where: { isPublic: true, isDeleted: false },
			attributes: { exclude: ['isDeleted'] }
		})

		return res.status(200).send({ posts })
	} catch(error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

export default router;