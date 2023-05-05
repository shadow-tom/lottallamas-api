import express from 'express';
const router = express.Router()

import { GetObjectCommand, ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import auth from '../../middleware/auth.js'
// import db from '@lotta-llamas/models';
import db from '../../../models/index.js'
// import { validate as uuidValidate } from 'uuid';
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid';


const filefilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
        req.fileValidationError = 'Only jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP file type are allowed!';
        return cb(new Error('Only jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP file type  are allowed!'), false);
    }
    return cb(null, true);
}

const storage = multer.memoryStorage()

const upload = multer({ storage: storage, fileFilter: filefilter })

router.post('/', auth, upload.single('file'), async (req, res, next) => {
    try {
        console.log(req.file.size)
        // 15MB size limit
        if (req.file.size > 15728640) {
            return res.status(401).send({ error: 'No images larger than 15MB, please' })
        }

        // create media record
        const media = await db.Media.create({
            walletId: req.address,
            usage: 'post',
            isDeleted: false,
            isPublic: true,
        })

        // upload image to spaces
        const data = await req.s3Client.send(new PutObjectCommand({
            Bucket: 'lottallamas-media',
            Key: `images/${media.id}`,
            Body: req.file.buffer,
            ACL: 'public-read',
            ContentType: 'image/png'
        }));
        console.log(req.file)
        return res.status(200).send('ok')
    } catch (error) {
        next(new Error(error))
    }
})














const streamToString = (stream) => {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    });
};


router.get('/', async (req, res, next) => {
    const data = await req.s3Client.send(new ListObjectsCommand({ Bucket: 'lottallamas-media' }));
    return res.status(200).send(data)
})

router.get('/:image_id', async (req, res, next) => {
    try {
        // const { imageId } = req.params.image_id;

        // if (!imageId) { return res.status(400).send('Missing image id') }

        const bucketParams = {
            Bucket: 'lottallamas-media',
            Key: 'images/test.png'
        };
  
        const response = await req.s3Client.send(new GetObjectCommand(bucketParams));
        const data = await streamToString(response.Body);
        res.writeHead(200, {'Content-Type': 'image/jpeg'});
        res.end(data, 'binary');
    
      } catch (error) {
        next(new Error(error))
    }

    // return res.status(200).send(data)
})


export default router;