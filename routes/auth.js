const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');

const { Address, Message } = require('bitcore-lib');

router.put('/validate-wallet', (req, res) => {
	const { address, signature, message } = req.body;

	if (!req.body || !address || !signature || !message) {
		res.status(404).send({ error: 'Missing params' })
	}

	if (!Address.isValid(address)) {
		res.status(404).send({ error: 'Invalid address'})
	}

	try {
		const verified = new Message(message).verify(address, signature);

		if (verified) {
			token = jwt.sign({ token: 'bar' }, 'shh');
			res.status(200).send({ token })
		} else {
			res.status(404).send({ error: 'Invalid Message' })
		}
	} catch(error) {
		res.status(500).send({ error });
	}
});

module.exports = router;