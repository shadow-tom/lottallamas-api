import express from 'express';
const router = express.Router()
import multer from 'multer'
import auth from '../../middleware/auth.js'
// import db from '@lotta-llamas/models';
import db from '../../../models/index.js'
import { PutObjectCommand } from "@aws-sdk/client-s3";

const IMAGE_PROFILES = {
	post: {
		height: 300,
		width: 400,
		maxSize: 15728640
	},
	avatar: {
		height: 48,
		width: 48,
		maxSize: 15728640
	},
	content: {
		height: 150,
		width: 150,
		maxSize: 15728640
	}
}

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
        return cb(new Error('Only jpeg, png, gif, or webp files allowed, please'), false);
    }
    return cb(null, true);
}

const storage = multer.memoryStorage()

const upload = multer({ storage, fileFilter }).single('file')

router.post('/images', auth, function (req, res, next) {
	upload(req, res, async (err) => {

		const imageType = req.query.type && Object.keys(IMAGE_PROFILES).includes(req.query.type) ? req.query.type : 'post';

		if (err && err.message) {
			return res.status(415).send({ error: err.message })
		}

		try {
			// Filter out large images
			if (req.file.size > IMAGE_PROFILES[imageType].maxSize) {
				return res.status(415).send({ error: 'No images larger than 15MB, please' })
			}

			// create media record
			const media = await db.Media.create({
				walletId: req.address,
				usage: imageType,
				originalname: req.file.originalname,
				mimetype: req.file.mimetype,
				isDeleted: false,
				isPublic: true,
			})
	
			// upload image to DO spaces:
			// https://lottallamas-media.nyc3.digitaloceanspaces.com
			await req.s3Client.send(new PutObjectCommand({
				Bucket: 'lottallamas-media',
				Key: `images/${media.id}-${imageType}`,
				Body: req.file.buffer,
				ACL: 'public-read',
				ContentType: req.file.mimetype
			}));
	
			return res.status(200).send({ media })
		} catch (error) {
			next(new Error(error))
		}
	})
})

export default router;

