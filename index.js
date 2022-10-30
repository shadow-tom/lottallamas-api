const express = require('express')
const app = express()
const cors = require('cors');
const port = 3100

app.use(cors({
    origin: '*'
}));

app.get('/', (req, res) => {
	res.send({ data: 'Hello Tombo' })
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})