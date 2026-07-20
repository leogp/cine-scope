import 'dotenv/config';
import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT ?? 4003;

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'recomendation-service' });
});

app.listen(PORT, () => {
  console.log(`recomendation-service running on port ${PORT}`);
});
