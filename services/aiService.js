import axios from 'axios';

// ===== CONFIGURAÇÃO NVIDIA NIM =====
const NVIDIA_CONFIG = {
    baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY,
    defaultModel: process.env.NVIDIA_DEFAULT_MODEL || 'meta/llama-3.1-70b-instruct',
    
    // Lista de modelos chat suportados
    chatModels: (process.env.NVIDIA_CHAT_MODELS || 'meta/llama-3.1-70b-instruct')
        .split(',')
        .map(m => m.trim())
        .filter(m => m),
    
    // Metadados dos modelos para exibição
    modelMetadata: {
        'meta/llama-3.1-70b-instruct': {
            name: 'Llama 3.1 70B',
            description: 'Modelo geral para chat e raciocínio',
            icon: '🦙',
            context: '128K',
            speed: 'fast'
        },
        'nvidia/nemotron-3-super-120b-a12b': {
            name: 'Nemotron 3 Super 120B',
            description: 'MoE híbrido para raciocínio agêntico',
            icon: '⚡',
            context: '1M',
            speed: 'medium'
        },
        'qwen/qwen3.5-122b-a10b': {
            name: 'Qwen 3.5 122B',
            description: 'LLM MoE para coding e multimodal',
            icon: '🔷',
            context: '256K',
            speed: 'medium'
        },
        'deepseek-ai/deepseek-v3.2': {
            name: 'DeepSeek V3.2',
            description: 'LLM de raciocínio state-of-the-art',
            icon: '🔶',
            context: '128K',
            speed: 'fast'
        },
        'google/gemma-3-27b-it': {
            name: 'Gemma 3 27B',
            description: 'Modelo multimodal open-source',
            icon: '💎',
            context: '32K',
            speed: 'fast'
        },
        'mistralai/mistral-large-3-675b-instruct-2512': {
            name: 'Mistral Large 3',
            description: 'VLM geral para chat e agentes',
            icon: '🌪️',
            context: '256K',
            speed: 'medium'
        }
    }
};

// ===== MEMORY DO CHAT =====
const chatMemory = new Map();

const getSystemPrompt = (context = {}) => {
    return `Você é ${process.env.CHATBOT_NAME || 'MedAssistente'}, assistente especializado em gestão hospitalar.

CONTEXTO:
- Hospital: ${context.hospital || 'Hospital Central São Lucas'}
- Usuário: ${context.role || 'profissional de saúde'}
- Data: ${new Date().toLocaleDateString('pt-BR')}

DIRETRIZES:
1. Seja profissional, empático e preciso
2. Baseie-se em práticas médicas e administrativas
3. NUNCA substitua julgamento clínico profissional
4. Para emergências, oriente atendimento imediato
5. Mantenha confidencialidade de dados
6. Use português do Brasil claro

Responda de forma concisa e útil.`;
};

// ===== FUNÇÕES PRINCIPAIS =====

export const getAvailableProviders = () => {
    const providers = [];
    
    // NVIDIA NIM
    if (NVIDIA_CONFIG.apiKey && NVIDIA_CONFIG.apiKey !== 'nvapi-TTTTT') {
        const models = NVIDIA_CONFIG.chatModels.map(modelId => {
            const meta = NVIDIA_CONFIG.modelMetadata[modelId] || {};
            return {
                id: `nvidia:${modelId}`,
                name: `${meta.icon || '🔵'} ${meta.name || modelId}`,
                available: true,
                provider: 'nvidia',
                model: modelId,
                description: meta.description
            };
        });
        providers.push(...models);
    }
    
    // Fallback para modo demo
    if (providers.length === 0) {
        providers.push({
            id: 'demo',
            name: '🔧 Modo Demo',
            available: true,
            provider: 'demo',
            description: 'Sem chave de API configurada'
        });
    }
    
    return providers;
};

export const switchProvider = (providerId) => {
    // Para NVIDIA, providerId é no formato "nvidia:model_id"
    if (providerId.startsWith('nvidia:')) {
        const modelId = providerId.replace('nvidia:', '');
        if (NVIDIA_CONFIG.chatModels.includes(modelId)) {
            process.env.NVIDIA_CURRENT_MODEL = modelId;
            return { success: true, model: modelId };
        }
        return { success: false, error: `Modelo "${modelId}" não disponível` };
    }
    
    if (providerId === 'demo') {
        process.env.AI_PROVIDER = 'demo';
        return { success: true };
    }
    
    return { success: false, error: 'Provider não suportado' };
};

export const getChatHistory = (userId, limit = 50) => {
    const history = chatMemory.get(userId) || [];
    return history.slice(-limit);
};

export const clearChatHistory = (userId) => {
    chatMemory.delete(userId);
    return true;
};

const saveToHistory = (userId, role, content) => {
    if (!chatMemory.has(userId)) chatMemory.set(userId, []);
    const history = chatMemory.get(userId);
    history.push({ role, content, timestamp: new Date().toISOString() });
    if (history.length > 100) history.shift();
};

// ===== NVIDIA NIM CALL =====

const callNVIDIA = async (messages, modelId, config) => {
    const endpoint = `${NVIDIA_CONFIG.baseUrl}/chat/completions`;
    
    const response = await axios.post(endpoint, {
        model: modelId,
        messages,
        max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3,
        stream: false
    }, {
        headers: {
            'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        timeout: 60000
    });
    
    return response.data.choices[0]?.message?.content || 'Sem resposta do modelo.';
};

// ===== MODO DEMO =====

const getMockResponse = (userMessage, context) => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('consulta') || msg.includes('agendar')) {
        return `📅 **Agendamento de Consultas**
        
Para agendar:
1. Acesse "Consultas" no menu
2. Clique em "+ Agendar Consulta"
3. Preencha os dados do paciente
4. Selecione médico e horário

Precisa de ajuda com algo específico?`;
    }
    if (msg.includes('paciente') || msg.includes('cadastrar')) {
        return `👥 **Cadastro de Pacientes**
        
1. Vá em "Pacientes"
2. Clique em "+ Novo Paciente"
3. Preencha: Nome, CPF, Data de Nascimento, Telefone, Convênio

O sistema gera ID automático!`;
    }
    if (msg.includes('relatório') || msg.includes('métrica')) {
        return `📊 **Relatórios Disponíveis**
        
• Dashboard: visão geral em tempo real
• Atendimentos: por período/especialidade
• Pacientes: ativos, inativos, novos
• Financeiro: consultas realizadas
• Produtividade: por médico

Qual deseja visualizar?`;
    }
    
    return `🏥 **MedAssistente - NVIDIA NIM**

Estou rodando com modelos NVIDIA de última geração:

${NVIDIA_CONFIG.chatModels.map(m => {
    const meta = NVIDIA_CONFIG.modelMetadata[m] || {};
    return `• ${meta.icon || '🔵'} ${meta.name || m}`;
}).join('\n')}

Posso ajudar com:
📅 Consultas | 👥 Pacientes | 👨‍⚕️ Médicos
📊 Relatórios | 🎫 Atendimentos | ⚙️ Configurações

Como posso ajudar?`;
};

// ===== FUNÇÃO PRINCIPAL =====

export const sendMessage = async (userMessage, options = {}) => {
    const { context = {}, provider, userId = 'anonymous' } = options;
    
    console.log(`📩 Mensagem: ${userMessage.substring(0, 50)}... | Provider: ${provider}`);
    
    // Modo demo ou provider não configurado
    if (!provider || provider === 'demo' || !NVIDIA_CONFIG.apiKey || NVIDIA_CONFIG.apiKey === 'nvapi-TTTTT') {
        const response = getMockResponse(userMessage, context);
        saveToHistory(userId, 'user', userMessage);
        saveToHistory(userId, 'assistant', response);
        return {
            message: response,
            provider: 'Modo Demo',
            timestamp: new Date().toISOString(),
            meta: { mock: true }
        };
    }
    
    // Extrair modelId do provider (formato: "nvidia:model_id")
    const modelId = provider.startsWith('nvidia:') ? provider.replace('nvidia:', '') : NVIDIA_CONFIG.defaultModel;
    
    const messages = [
        { role: 'system', content: getSystemPrompt(context) },
        ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: userMessage }
    ];
    
    saveToHistory(userId, 'user', userMessage);
    
    try {
        console.log(`🤖 Chamando NVIDIA: ${modelId}`);
        
        const response = await callNVIDIA(messages, modelId, options);
        
        saveToHistory(userId, 'assistant', response);
        
        const meta = NVIDIA_CONFIG.modelMetadata[modelId] || {};
        
        return {
            message: response,
            provider: meta.name || modelId,
            timestamp: new Date().toISOString(),
            meta: {
                model: modelId,
                context: meta.context,
                icon: meta.icon
            }
        };
        
    } catch (error) {
        console.error(`❌ Erro NVIDIA ${modelId}:`, error.message);
        
        // Fallback para resposta de erro amigável
        const fallback = `⚠️ **Erro ao processar com ${modelId}**

Detalhes: ${error.message}

Tente:
1. Verificar sua chave NVIDIA_API_KEY no .env
2. Confirmar que o modelo está disponível na sua conta
3. Trocar para outro modelo no seletor

Enquanto isso, posso ajudar com informações do sistema.`;
        
        saveToHistory(userId, 'assistant', fallback);
        
        return {
            message: fallback,
            provider: 'Erro',
            timestamp: new Date().toISOString(),
            meta: { error: error.message, fallback: true }
        };
    }
};