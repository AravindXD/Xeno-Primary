import { Router } from 'express';
import { syncData } from '../controllers/ingest.controller';

const router = Router();

router.post('/sync', syncData);

export default router;
