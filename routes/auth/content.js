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
			include: 'posts'
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
	const { title, description, isPublic, token } = req.body
	// Determine what assets are in the db that belong to your walletId
	const tokensObjsInUse = await db.Content.findAll({ attributes: ['token'], where: { walletId: req.address } })
	// Map through and return array of tokens
	const tokensInUse = tokensObjsInUse.map((objs) => objs.token);
	// Filter empty strings
	const availableInWallet = req.assets.filter((token) => !tokensInUse.includes(token) ? token : false)
	// See if that token is in your wallet
	if(!availableInWallet.includes(token)) { 
		return res.status(401).send({ error: 'Token not available in wallet' })
	}

	try {
		// Determine if the token exists at all in the db
		const tokenInDb = await db.Content.findOne({ where: { token }})
		// Handle uniqueness
		if (tokenInDb) { return res.status(401).send({ error: 'Token must be unique' }) }

		const content = await db.Content.create({
			walletId: req.address,
			title,
			description,
			isPublic,
			token
		});
	
		res.status(200).send({ content })
	} catch (error) {
		res.status(500).send({ error })
	}
})

router.put('/:contentId', auth, async (req, res) => {
	const contentId = req.params.contentId;
	const { title, description, isPublic } = req.body

	if (!title) { return res.status(401).send({ error: 'Missing title' }) }

	try {
		const [row, content] = await db.Content.update({
				title,
				description,
				isPublic,
			}, {
			where: {
				id: contentId,
				walletId: req.address
			},
			returning: true
		});
	
		res.status(200).send({ content })
	} catch (error) {
		res.status(500).send({ error })
	}
})

export default router;