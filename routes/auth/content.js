import express from 'express';
const router = express.Router()
// import auth from '../../middleware/auth.js'

// const tempContent = {
// 	walletId: '1FBuCHMw5e5yTNKbf1eJq1bXZjoGaXeqwV',
// 	cid: 'QmbBnZBudfuGbbzDRTAhSVEYsoxCAe5yBimuuYvYu3BMHG',
// 	title: 'Batman Comic'
// }

// const forgienContent = {
// 	walletId: '1JaAo2i7MNrWXeyzQs4tNJidQhi682MSo9',
// 	cid: 'QmXeetrDXEkLgevZyMZa8SwJoSD5CGtptqmTDZwM6XExAe',
// 	title: 'Different Things'
// }

// // GET all content items
// router.get('/items', async (req, res) => {
// 	const content = await req.db.content.get('')
// 	res.status(200).send({ content })
// })

// // GET wallet specific items
// router.get('/:itemId', (req, res) => {

// })

// // PUT content
// router.put('/item', async (req, res) => {
// 	// TODO: IPFS file upload and storing CID through orbit
// 	const { walletId, cid, title } = forgienContent;
// 	const hash = await req.db.content.put({ walletId, cid, title })
// 	res.status(200).send({})
// })


// POST content
export default router;