import express from 'express';
import cors from 'cors';
const app = express()

import auth from './routes/auth.js';

const port = 3100

app.use(cors({
    origin: '*'
}));

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use("/api/auth", auth);

if (process.env.NODE_ENV !== 'test') {
	app.listen(3100, () => {
		console.log(`Example app listening on port ${port}`)
	})
}

export default app;