import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { chatLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/chat', chatLimiter, ChatController.handleChatRequest);
router.get('/models', ChatController.listAvailableModels);
router.get('/conversations', ChatController.listConversations);
router.get('/conversations/:id', ChatController.getConversation);
router.patch('/conversations/:id', ChatController.renameConversation);
router.delete('/conversations/:id', ChatController.deleteConversation);

export default router;
