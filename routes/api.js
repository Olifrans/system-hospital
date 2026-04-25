import { Router } from 'express';
import { 
    sendMessage, 
    getAvailableProviders, 
    switchProvider,
    getChatHistory,
    clearChatHistory 
} from '../services/aiService.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'MedGestão Pro API',
        timestamp: new Date().toISOString(),
        provider: process.env.AI_PROVIDER || 'nvidia',
        uptime: process.uptime()
    });
});

// Listar providers/modelos disponíveis
router.get('/chat/providers', (req, res) => {
    try {
        const providers = getAvailableProviders();
        res.json({
            success: true,
             {
                current: process.env.NVIDIA_CURRENT_MODEL || process.env.AI_PROVIDER,
                available: providers
            }
        });
    } catch (error) {
        console.error('❌ Erro em /chat/providers:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
             {
                current: 'demo',
                available: [{ id: 'demo', name: '🔧 Modo Demo', available: true }]
            }
        });
    }
});

// Enviar mensagem
router.post('/chat/message', async (req, res) => {
    try {
        const { message, context, provider } = req.body;
        
        if (!message?.trim()) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }
        
        const response = await sendMessage(message, {
            context: context || {},
            provider: provider || process.env.NVIDIA_CURRENT_MODEL,
            userId: req.headers['x-user-id'] || 'anonymous'
        });
        
        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erro em /chat/message:', error);
        res.status(500).json({ error: error.message, success: false });
    }
});

// Trocar modelo/provider
router.post('/chat/provider/switch', (req, res) => {
    try {
        const { provider } = req.body;
        
        if (!provider) {
            return res.status(400).json({ error: 'Provider é obrigatório' });
        }
        
        const result = switchProvider(provider);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Modelo alterado para: ${result.model || provider}`,
                data: { provider: result.model || provider }
            });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error('❌ Erro em /chat/provider/switch:', error);
        res.status(500).json({ error: error.message });
    }
});

// Histórico do chat
router.get('/chat/history', (req, res) => {
    try {
        const { limit = 50, userId = 'anonymous' } = req.query;
        const history = getChatHistory(userId, parseInt(limit));
        res.json({ success: true,  history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Limpar histórico
router.delete('/chat/history', (req, res) => {
    try {
        const { userId = 'anonymous' } = req.query;
        clearChatHistory(userId);
        res.json({ success: true, message: 'Histórico limpo' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;