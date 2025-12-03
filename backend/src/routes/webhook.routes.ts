import { Router } from 'express';
import { handleWebhook } from '../controllers/webhook.controller';

const router = Router();

// Shopify webhooks endpoint
// Note: In production, configure this endpoint in Shopify app settings
router.post('/shopify', handleWebhook);

export default router;

