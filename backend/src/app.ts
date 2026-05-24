import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import swaggerSpec from './config/swagger';
import routes from './routes';
import requestId from './middleware/requestId';
import sanitize from './middleware/sanitize';
import { apiLimiter } from './middleware/rateLimit';
import errorHandler from './middleware/errorHandler';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(hpp());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestId);
app.use(sanitize);
app.use(apiLimiter);
app.use(morgan('combined'));

if (env.SWAGGER_ENABLED) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use('/api', routes);
app.use(errorHandler);
