import express from 'express';
const router = express.Router()
import auth from '../../middleware/auth.js'
import db from '../../../models/index.js'
import Sequelize from 'sequelize';
import { validate as uuidValidate } from 'uuid';

/**
 * GET /api/auth/content
 * @summary Get all content objects that pertain to assets in wallet
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Returns all applicable content
 */

router.get('/', auth, async (req, res) => {
	try {
		const content = await db.Content.findAll({ 
			where: {
				token: {
					[Sequelize.Op.in]: req.assets
				}
			}
		});
		req.logger.log({ level: 'info', message: `Address: ${req.address} requesting all content`});
		res.status(200).send({ content })
	} catch (error) {
		req.logger.log({ level: 'error', message: error });
		res.status(500).send({ error })
	}
})

/**
 * GET /api/auth/content/:contentId
 * @summary Get specific content object
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 400 Content ID malformed
 * @throws {object} - 401 Token not available in wallet
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Returns singular content object
 */

router.get('/:contentId', auth, async (req, res, next) => {
	try {
		const { contentId } = req.params;
	
		if (!uuidValidate(contentId)) {
			return res.status(400).send({ error: 'Content ID malformed' })
		}
	
		const content = await db.Content.findByPk(contentId);

		if(!req.assets.includes(content.token)) { 
			return res.status(401).send({ error: 'Token not available in wallet' })
		}
		req.logger.log({ level: 'info', message: `Address: ${req.address} GET'n content: ${contentId}`});
		res.status(200).send({ content })
	} catch(error) {
		next(new Error(error))
	}
})

/**
 * POST /api/auth/content
 * @summary Create specific content object
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 401 Token not available in wallet
 * @throws {object} - 409 Token must be unique
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Creates content record and returns updated record
 */

router.post('/', auth, async (req, res, next) => {
	const { title, description, isPublic, token } = req.body.content
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
		if (tokenInDb) { return res.status(409).send({ error: 'Token must be unique' }) }

		const content = await db.Content.create({
			walletId: req.address,
			title,
			description,
			isPublic,
			token
		});
		req.logger.log({ level: 'info', message: `Address: ${req.address} creating content`});
		res.status(200).send({ content })
	} catch (error) {
		next(new Error(error))
	}
})

/**
 * PUT /api/auth/content/:contentId
 * @summary Updates specific content object
 * @param {object} req The Express request object
 * @param {object} res The Express response object
 * @throws {object} - 400 Missing title
 * @throws {object} - 500 Server Error
 * @return {object} - 200 Updates record and returns updated record
 */

router.put('/:contentId', auth, async (req, res, next) => {
	const contentId = req.params.contentId;
	const { title, description, isPublic } = req.body.content;

	if (!title) { return res.status(400).send({ error: 'Missing title' }) }

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
		req.logger.log({ level: 'info', message: `Address: ${req.address} updating content: ${contentId}`});
		res.status(200).send({ content })
	} catch (error) {
		next(new Error(error))
	}
})

export default router;