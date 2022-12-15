import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '../../../models/models/index.js'
import Sequelize from 'sequelize';
import { validate as uuidValidate } from 'uuid';

// GET Content
router.get('/', auth, async (req, res) => {
	try {
		const content = await db.Content.findAll({ 
			where: {
				token: {
					[Sequelize.Op.in]: req.assets
				}
			}
		});
		res.status(200).send({ content })
	} catch (error) {
		res.status(500).send({ error })
	}
})

// GET Content by contentId
router.get('/:contentId', auth, async (req, res) => {
	try {
		const { contentId } = req.params;
	
		if (!uuidValidate(contentId)) {
			return res.status(400).send({ error: 'Content ID malformed' })
		}
	
		const content = await db.Content.findByPk(contentId, {
			include: ['Posts'],
		});
	
		if(!req.assets.includes(content.token)) { 
			return res.status(401).send({ error: 'Token not available in wallet' })
		}
	
		res.status(200).send({ content })
	} catch(error) {
		res.status(500).send({ error })
	}
})

// POST Create Content
router.post('/', auth, async (req, res) => {
	const tokens = req.assets ? req.assets : [];
	const { title, description, isPublic, token } = req.body

	if(!tokens.includes(token)) { 
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		const [content, created] = await db.Content.findOrCreate({
			where: { walletId: req.address },
			defaults: {
				walletId: req.address,
				title,
				description,
				isPublic,
				token
			}
		});

		if (!created) { return res.status(401).send({ error:'Token must be unique' })}
	
		res.status(200).send({ content })
	} catch (error) {
		res.status(500).send({ error })
	}
})

export default router;