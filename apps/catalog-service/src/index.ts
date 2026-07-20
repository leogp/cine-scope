import 'dotenv/config';
import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT ?? 4002;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'catalog-service' });
});

app.listen(PORT, () => {
  console.log(`catalog-service running on port ${PORT}`);
});
