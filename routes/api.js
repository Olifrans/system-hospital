// routes/api.js
import { Router } from 'express';
import { 
    sendMessage, 
    getAvailableProviders, 
    switchProvider,
    getChatHistory,
    clearChatHistory 
} from '../services/aiService.js';

const router = Router();

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
    try {
        res.json({
            status: 'ok',
            service: 'MedGestão Pro API',
            timestamp: new Date().toISOString(),
            aiProvider: process.env.AI_PROVIDER || 'demo',
            nvidiaEnabled: !!process.env.NVIDIA_API_KEY?.trim()?.startsWith('nvapi-'),
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('❌ Erro em /health:', error);
        res.status(500).json({ 
            status: 'error', 
            error: 'Erro interno do servidor' 
        });
    }
});

// ===== LISTAR PROVIDERS/MODELOS DISPONÍVEIS =====
router.get('/chat/providers', (req, res) => {
    try {
        console.log('📡 [API] GET /api/chat/providers');
        
        const providers = getAvailableProviders();
        
        console.log(`✅ [API] ${providers.length} provider(es) encontrado(s)`);
        console.log('   📋 Providers:', providers.map(p => p.name).join(', '));
        
        res.json({
            success: true,
            data: {  // ← CORREÇÃO: chave 'data' obrigatória
                current: process.env.NVIDIA_CURRENT_MODEL || process.env.AI_PROVIDER || 'demo',
                available: providers
            }
        });
    } catch (error) {
        console.error('❌ [API] Erro em /chat/providers:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            data: {  // ← CORREÇÃO: chave 'data' obrigatória
                current: 'demo',
                available: [{ id: 'demo', name: '🔧 Modo Demo', available: true }]
            }
        });
    }
});

// ===== ENVIAR MENSAGEM PARA O CHATBOT =====
router.post('/chat/message', async (req, res) => {
    try {
        const { message, context, provider } = req.body;
        
        console.log('📩 [API] POST /api/chat/message:', { 
            message: message?.substring(0, 30) + '...', 
            provider,
            userId: req.headers['x-user-id'] || 'anonymous'
        });
        
        // Validação básica
        if (!message?.trim()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Mensagem é obrigatória',
                data: null 
            });
        }
        
        // Processar mensagem
        const response = await sendMessage(message, {
            context: context || {},
            provider: provider || process.env.NVIDIA_CURRENT_MODEL || process.env.AI_PROVIDER,
            userId: req.headers['x-user-id'] || 'anonymous'
        });
        
        console.log('✅ [API] Mensagem processada com sucesso');
        
        res.json({
            success: true,
            data: response,  // ← CORREÇÃO: chave 'data' obrigatória
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ [API] Erro em /chat/message:', error);
        
        // Resposta de fallback amigável
        res.status(500).json({ 
            success: false, 
            error: error.message,
            data: {
                message: '❌ Erro ao processar sua mensagem. Tente novamente.',
                provider: 'Erro',
                timestamp: new Date().toISOString(),
                meta: { error: error.message, fallback: true }
            }
        });
    }
});

// ===== TROCAR PROVIDER/MODELO ATIVO =====
router.post('/chat/provider/switch', (req, res) => {
    try {
        const { provider } = req.body;
        
        console.log('🔄 [API] POST /api/chat/provider/switch:', { provider });
        
        // Validação
        if (!provider) {
            return res.status(400).json({ 
                success: false, 
                error: 'Provider é obrigatório',
                data: null 
            });
        }
        
        // Executar troca
        const result = switchProvider(provider);
        
        if (result.success) {
            console.log(`✅ [API] Provider alterado para: ${result.model || provider}`);
            
            res.json({
                success: true,
                message: `Modelo alterado para: ${result.model || provider}`,
                data: {  // ← CORREÇÃO: chave 'data' obrigatória
                    provider: result.model || provider,
                    previous: process.env.AI_PROVIDER
                }
            });
        } else {
            console.log(`⚠️ [API] Falha ao trocar provider: ${result.error}`);
            
            res.status(400).json({ 
                success: false, 
                error: result.error,
                data: null 
            });
        }
        
    } catch (error) {
        console.error('❌ [API] Erro em /chat/provider/switch:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            data: null 
        });
    }
});

// ===== OBTER HISTÓRICO DO CHAT =====
router.get('/chat/history', (req, res) => {
    try {
        const { limit = 50, userId = 'anonymous' } = req.query;
        
        console.log('📚 [API] GET /api/chat/history:', { limit, userId });
        
        const history = getChatHistory(userId, parseInt(limit));
        
        res.json({
            success: true,
            data: {  // ← CORREÇÃO: chave 'data' obrigatória
                history,
                count: history.length,
                userId
            }
        });
    } catch (error) {
        console.error('❌ [API] Erro em /chat/history:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            data: { history: [], count: 0 }
        });
    }
});

// ===== LIMPAR HISTÓRICO DO CHAT =====
router.delete('/chat/history', (req, res) => {
    try {
        const { userId = 'anonymous' } = req.query;
        
        console.log('🗑️ [API] DELETE /api/chat/history:', { userId });
        
        clearChatHistory(userId);
        
        res.json({
            success: true,
            message: 'Histórico limpo com sucesso',
            data: {  // ← CORREÇÃO: chave 'data' obrigatória
                userId,
                cleared: true
            }
        });
    } catch (error) {
        console.error('❌ [API] Erro em DELETE /chat/history:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            data: null 
        });
    }
});

// ===== DEBUG ENDPOINT (apenas development) =====
if (process.env.NODE_ENV !== 'production') {
    router.get('/debug/env', (req, res) => {
        // Nunca exponha chaves reais em produção!
        const safeEnv = {
            PORT: process.env.PORT,
            NODE_ENV: process.env.NODE_ENV,
            AI_PROVIDER: process.env.AI_PROVIDER,
            NVIDIA_API_KEY: process.env.NVIDIA_API_KEY ? '✅ Definida' : '❌ Não definida',
            NVIDIA_CHAT_MODELS: process.env.NVIDIA_CHAT_MODELS,
            CHATBOT_NAME: process.env.CHATBOT_NAME
        };
        
        res.json({
            success: true,
            data: safeEnv
        });
    });
}

export default router;