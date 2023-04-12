import express from 'express'
import cors from 'cors'
const app = express()

import auth from './routes/auth.js'
import publicContent from './routes/public.js'
import wallets from './routes/auth/wallets.js'
import content from './routes/auth/content.js'
import posts from './routes/auth/posts.js'
import comments from './routes/auth/comments.js'
import winston from 'winston'

const port = 3100

app.use(cors({
    origin: '*'
}));

// Logging middleware
app.use((req, res, next) => {
	// TODO: Adjust appropriate transports
	switch (process.env.NODE_ENV) {
		case 'production':
			req.logger = winston.createLogger({
				transports: [
					new winston.transports.Console(),
					new winston.transports.File({ filename: 'logs/combined.log' })
				]
			});
			break;
		case 'development':
			req.logger = winston.createLogger({
				transports: [
					new winston.transports.Console(),
				]
			});
			break;
		default:
			req.logger = winston.createLogger({
				transports: [
					new winston.transports.Console({
						silent: true
					}),
				]
			});
	}

	next()
})

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencode
app.use('/api', auth);
app.use('/api/wallets', wallets);
app.use('/api/content', content);
app.use('/api/posts', posts);
app.use('/api/public', publicContent);
app.use('/api/comments', comments);

if (process.env.NODE_ENV !== 'test') {
	app.listen(port, () => {
		console.log(`Example app listening on port ${port}`)
	})
}

export default app;