import pkg from 'bitcore-lib';
const { Address } = pkg;

export default function verifyWalletBodyParams(req, res, next) {
	if (!req.body || !req.body.address || !req.body.signature || !req.body.message) {
		return res.status(401).send({ error: 'Missing params' })
	}

	if (!Address.isValid(req.body.address)) {
		return res.status(401).send({ error: 'Invalid address'})
	}

	next()
}