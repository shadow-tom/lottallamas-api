import express from 'express';
const router = express.Router()
import db from '@lotta-llamas/models';

// GET all public posts
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