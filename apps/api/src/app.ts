import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { tenantRouter } from './routes/tenants';
import { productRouter } from './routes/products';
import { userRouter } from './routes/users';
import { webhookRouter } from './routes/webhooks';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('dev'));

  app.use('/auth', authRouter);
  app.use('/health', healthRouter);
  app.use('/tenants', tenantRouter);
  app.use('/products', productRouter);
  app.use('/users', userRouter);
  app.use('/webhooks', webhookRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Unexpected error', error: err.message });
  });

  return app;
}
