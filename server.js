import express from 'express'
import * as Sentry from "@sentry/node";
import cors from 'cors'
import helmet from 'helmet'

const app = express()

import auth from './routes/auth.js'
import publicContent from './routes/public.js'
import wallets from './routes/auth/wallets.js'
import content from './routes/auth/content.js'
import posts from './routes/auth/posts.js'
import comments from './routes/auth/comments.js'
import winston from 'winston'

const port = 3100

Sentry.init({
	dsn: "https://d6f04ce1954d4d2eb1db1dadc5360949@o4505004650463232.ingest.sentry.io/4505008298196993",
	integrations: [
		// enable HTTP calls tracing
		new Sentry.Integrations.Http({ tracing: true }),
		// enable Express.js middleware tracing
		new Sentry.Integrations.Express({
		  // to trace all requests to the default router
		  app,
		  // alternatively, you can specify the routes you want to trace:
		  // router: someRouter,
		}),
	  ],
	
	  // We recommend adjusting this value in production, or using tracesSampler
	  // for finer control
	  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(helmet());

var whitelist = ['https://lottallamas.com', 'http://localhost:4200']

var corsOptions = {
	origin: function (origin, callback) {
		if (whitelist.indexOf(origin) !== -1) {
			callback(null, true)
		} else {
			callback(new Error('Not allowed by CORS'))
		}
	}
}

app.use(cors(corsOptions));

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
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use('/api', auth);
app.use('/api/wallets', wallets);
app.use('/api/content', content);
app.use('/api/posts', posts);
app.use('/api/public', publicContent);
app.use('/api/comments', comments);

if (process.env.NODE_ENV !== 'test') {
	app.use(Sentry.Handlers.errorHandler());
	app.listen(port, () => {
		console.log(`Example app listening on port ${port}`)
	})
}

export default app;