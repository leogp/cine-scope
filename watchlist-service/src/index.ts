import 'dotenv/config';
import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT ?? 4005;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'watchlist-service' });
});

app.listen(PORT, () => {
  console.log(`watchlist-service running on port ${PORT}`);
});
