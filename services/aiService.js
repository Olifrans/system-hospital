// import axios from 'axios';

// // ===== CONFIGURAÇÃO NVIDIA NIM =====
// const NVIDIA_CONFIG = {
//     baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
//     apiKey: process.env.NVIDIA_API_KEY,
//     defaultModel: process.env.NVIDIA_DEFAULT_MODEL || 'meta/llama-3.1-70b-instruct',
    
//     // Lista de modelos chat suportados
//     chatModels: (process.env.NVIDIA_CHAT_MODELS || 'meta/llama-3.1-70b-instruct')
//         .split(',')
//         .map(m => m.trim())
//         .filter(m => m),
    
//     // Metadados dos modelos para exibição
//     modelMetadata: {
//         'meta/llama-3.1-70b-instruct': {
//             name: 'Llama 3.1 70B',
//             description: 'Modelo geral para chat e raciocínio',
//             icon: '🦙',
//             context: '128K',
//             speed: 'fast'
//         },
//         'nvidia/nemotron-3-super-120b-a12b': {
//             name: 'Nemotron 3 Super 120B',
//             description: 'MoE híbrido para raciocínio agêntico',
//             icon: '⚡',
//             context: '1M',
//             speed: 'medium'
//         },
//         'qwen/qwen3.5-122b-a10b': {
//             name: 'Qwen 3.5 122B',
//             description: 'LLM MoE para coding e multimodal',
//             icon: '🔷',
//             context: '256K',
//             speed: 'medium'
//         },
//         'deepseek-ai/deepseek-v3.2': {
//             name: 'DeepSeek V3.2',
//             description: 'LLM de raciocínio state-of-the-art',
//             icon: '🔶',
//             context: '128K',
//             speed: 'fast'
//         },
//         'google/gemma-3-27b-it': {
//             name: 'Gemma 3 27B',
//             description: 'Modelo multimodal open-source',
//             icon: '💎',
//             context: '32K',
//             speed: 'fast'
//         },
//         'mistralai/mistral-large-3-675b-instruct-2512': {
//             name: 'Mistral Large 3',
//             description: 'VLM geral para chat e agentes',
//             icon: '🌪️',
//             context: '256K',
//             speed: 'medium'
//         }
//     }
// };

// // ===== MEMORY DO CHAT =====
// const chatMemory = new Map();

// const getSystemPrompt = (context = {}) => {
//     return `Você é ${process.env.CHATBOT_NAME || 'MedAssistente'}, assistente especializado em gestão hospitalar.

// CONTEXTO:
// - Hospital: ${context.hospital || 'Hospital Central São Lucas'}
// - Usuário: ${context.role || 'profissional de saúde'}
// - Data: ${new Date().toLocaleDateString('pt-BR')}

// DIRETRIZES:
// 1. Seja profissional, empático e preciso
// 2. Baseie-se em práticas médicas e administrativas
// 3. NUNCA substitua julgamento clínico profissional
// 4. Para emergências, oriente atendimento imediato
// 5. Mantenha confidencialidade de dados
// 6. Use português do Brasil claro

// Responda de forma concisa e útil.`;
// };

// // ===== FUNÇÕES PRINCIPAIS =====

// export const getAvailableProviders = () => {
//     const providers = [];
    
//     // NVIDIA NIM
//     if (NVIDIA_CONFIG.apiKey && NVIDIA_CONFIG.apiKey !== 'nvapi-TTTTT') {
//         const models = NVIDIA_CONFIG.chatModels.map(modelId => {
//             const meta = NVIDIA_CONFIG.modelMetadata[modelId] || {};
//             return {
//                 id: `nvidia:${modelId}`,
//                 name: `${meta.icon || '🔵'} ${meta.name || modelId}`,
//                 available: true,
//                 provider: 'nvidia',
//                 model: modelId,
//                 description: meta.description
//             };
//         });
//         providers.push(...models);
//     }
    
//     // Fallback para modo demo
//     if (providers.length === 0) {
//         providers.push({
//             id: 'demo',
//             name: '🔧 Modo Demo',
//             available: true,
//             provider: 'demo',
//             description: 'Sem chave de API configurada'
//         });
//     }
    
//     return providers;
// };

// export const switchProvider = (providerId) => {
//     // Para NVIDIA, providerId é no formato "nvidia:model_id"
//     if (providerId.startsWith('nvidia:')) {
//         const modelId = providerId.replace('nvidia:', '');
//         if (NVIDIA_CONFIG.chatModels.includes(modelId)) {
//             process.env.NVIDIA_CURRENT_MODEL = modelId;
//             return { success: true, model: modelId };
//         }
//         return { success: false, error: `Modelo "${modelId}" não disponível` };
//     }
    
//     if (providerId === 'demo') {
//         process.env.AI_PROVIDER = 'demo';
//         return { success: true };
//     }
    
//     return { success: false, error: 'Provider não suportado' };
// };

// export const getChatHistory = (userId, limit = 50) => {
//     const history = chatMemory.get(userId) || [];
//     return history.slice(-limit);
// };

// export const clearChatHistory = (userId) => {
//     chatMemory.delete(userId);
//     return true;
// };

// const saveToHistory = (userId, role, content) => {
//     if (!chatMemory.has(userId)) chatMemory.set(userId, []);
//     const history = chatMemory.get(userId);
//     history.push({ role, content, timestamp: new Date().toISOString() });
//     if (history.length > 100) history.shift();
// };

// // ===== NVIDIA NIM CALL =====

// const callNVIDIA = async (messages, modelId, config) => {
//     const endpoint = `${NVIDIA_CONFIG.baseUrl}/chat/completions`;
    
//     const response = await axios.post(endpoint, {
//         model: modelId,
//         messages,
//         max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
//         temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3,
//         stream: false
//     }, {
//         headers: {
//             'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
//             'Content-Type': 'application/json',
//             'Accept': 'application/json'
//         },
//         timeout: 60000
//     });
    
//     return response.data.choices[0]?.message?.content || 'Sem resposta do modelo.';
// };

// // ===== MODO DEMO =====

// const getMockResponse = (userMessage, context) => {
//     const msg = userMessage.toLowerCase();
    
//     if (msg.includes('consulta') || msg.includes('agendar')) {
//         return `📅 **Agendamento de Consultas**
        
// Para agendar:
// 1. Acesse "Consultas" no menu
// 2. Clique em "+ Agendar Consulta"
// 3. Preencha os dados do paciente
// 4. Selecione médico e horário

// Precisa de ajuda com algo específico?`;
//     }
//     if (msg.includes('paciente') || msg.includes('cadastrar')) {
//         return `👥 **Cadastro de Pacientes**
        
// 1. Vá em "Pacientes"
// 2. Clique em "+ Novo Paciente"
// 3. Preencha: Nome, CPF, Data de Nascimento, Telefone, Convênio

// O sistema gera ID automático!`;
//     }
//     if (msg.includes('relatório') || msg.includes('métrica')) {
//         return `📊 **Relatórios Disponíveis**
        
// • Dashboard: visão geral em tempo real
// • Atendimentos: por período/especialidade
// • Pacientes: ativos, inativos, novos
// • Financeiro: consultas realizadas
// • Produtividade: por médico

// Qual deseja visualizar?`;
//     }
    
//     return `🏥 **MedAssistente - NVIDIA NIM**

// Estou rodando com modelos NVIDIA de última geração:

// ${NVIDIA_CONFIG.chatModels.map(m => {
//     const meta = NVIDIA_CONFIG.modelMetadata[m] || {};
//     return `• ${meta.icon || '🔵'} ${meta.name || m}`;
// }).join('\n')}

// Posso ajudar com:
// 📅 Consultas | 👥 Pacientes | 👨‍⚕️ Médicos
// 📊 Relatórios | 🎫 Atendimentos | ⚙️ Configurações

// Como posso ajudar?`;
// };

// // ===== FUNÇÃO PRINCIPAL =====

// export const sendMessage = async (userMessage, options = {}) => {
//     const { context = {}, provider, userId = 'anonymous' } = options;
    
//     console.log(`📩 Mensagem: ${userMessage.substring(0, 50)}... | Provider: ${provider}`);
    
//     // Modo demo ou provider não configurado
//     if (!provider || provider === 'demo' || !NVIDIA_CONFIG.apiKey || NVIDIA_CONFIG.apiKey === 'nvapi-TTTTT') {
//         const response = getMockResponse(userMessage, context);
//         saveToHistory(userId, 'user', userMessage);
//         saveToHistory(userId, 'assistant', response);
//         return {
//             message: response,
//             provider: 'Modo Demo',
//             timestamp: new Date().toISOString(),
//             meta: { mock: true }
//         };
//     }
    
//     // Extrair modelId do provider (formato: "nvidia:model_id")
//     const modelId = provider.startsWith('nvidia:') ? provider.replace('nvidia:', '') : NVIDIA_CONFIG.defaultModel;
    
//     const messages = [
//         { role: 'system', content: getSystemPrompt(context) },
//         ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })),
//         { role: 'user', content: userMessage }
//     ];
    
//     saveToHistory(userId, 'user', userMessage);
    
//     try {
//         console.log(`🤖 Chamando NVIDIA: ${modelId}`);
        
//         const response = await callNVIDIA(messages, modelId, options);
        
//         saveToHistory(userId, 'assistant', response);
        
//         const meta = NVIDIA_CONFIG.modelMetadata[modelId] || {};
        
//         return {
//             message: response,
//             provider: meta.name || modelId,
//             timestamp: new Date().toISOString(),
//             meta: {
//                 model: modelId,
//                 context: meta.context,
//                 icon: meta.icon
//             }
//         };
        
//     } catch (error) {
//         console.error(`❌ Erro NVIDIA ${modelId}:`, error.message);
        
//         // Fallback para resposta de erro amigável
//         const fallback = `⚠️ **Erro ao processar com ${modelId}**

// Detalhes: ${error.message}

// Tente:
// 1. Verificar sua chave NVIDIA_API_KEY no .env
// 2. Confirmar que o modelo está disponível na sua conta
// 3. Trocar para outro modelo no seletor

// Enquanto isso, posso ajudar com informações do sistema.`;
        
//         saveToHistory(userId, 'assistant', fallback);
        
//         return {
//             message: fallback,
//             provider: 'Erro',
//             timestamp: new Date().toISOString(),
//             meta: { error: error.message, fallback: true }
//         };
//     }
// };














// services/aiService.js
import axios from 'axios';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ===== CONFIGURAÇÃO DOS PROVIDERS =====
const PROVIDERS = {
  
  // ===== NVIDIA NIM =====
  nvidia: {
    name: 'NVIDIA NIM',
    enabled: false,
    endpoint: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    defaultModel: process.env.NVIDIA_DEFAULT_MODEL || 'meta/llama-3.1-70b-instruct',
    chatModels: [],
    
    init: () => {
      const key = process.env.NVIDIA_API_KEY;
      const modelsEnv = process.env.NVIDIA_CHAT_MODELS || '';
      
      // Debug logs
      console.log('🔍 [NVIDIA] API Key presente:', !!key);
      console.log('🔍 [NVIDIA] API Key length:', key?.length);
      console.log('🔍 [NVIDIA] API Key starts with nvapi-:', key?.trim().startsWith('nvapi-'));
      console.log('🔍 [NVIDIA] Models env:', modelsEnv);
      
      // Validação robusta da chave
      if (key && typeof key === 'string') {
        const cleanKey = key.trim();
        if (cleanKey.startsWith('nvapi-') && cleanKey.length >= 20) {
          PROVIDERS.nvidia.enabled = true;
          
          // Parse dos modelos disponíveis
          if (modelsEnv) {
            PROVIDERS.nvidia.chatModels = modelsEnv
              .split(',')
              .map(m => m.trim())
              .filter(m => m);
          } else {
            PROVIDERS.nvidia.chatModels = [PROVIDERS.nvidia.defaultModel];
          }
          
          console.log('✅ NVIDIA NIM configurado');
          console.log(`   📦 Modelos disponíveis: ${PROVIDERS.nvidia.chatModels.join(', ')}`);
        } else {
          console.log('⚠️  NVIDIA NIM: chave com formato inválido');
          console.log(`   💡 Dica: A chave deve começar com "nvapi-" e ter pelo menos 20 caracteres`);
        }
      } else {
        console.log('⚠️  NVIDIA NIM: chave não configurada');
      }
    }
  },
  
  // ===== OpenAI =====
  openai: {
    name: 'OpenAI (GPT)',
    enabled: false,
    client: null,
    init: () => {
      const key = process.env.OPENAI_API_KEY?.trim();
      if (key && key.length > 20 && (key.startsWith('sk-') || key.startsWith('sk-proj-'))) {
        try {
          PROVIDERS.openai.client = new OpenAI({ apiKey: key });
          PROVIDERS.openai.enabled = true;
          console.log('✅ OpenAI configurado');
        } catch (error) {
          console.log('⚠️  OpenAI: erro ao inicializar cliente:', error.message);
        }
      } else {
        console.log('⚠️  OpenAI não configurado');
      }
    }
  },
  
  // ===== DeepSeek =====
  deepseek: {
    name: 'DeepSeek',
    enabled: false,
    endpoint: 'https://api.deepseek.com/v1',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    init: () => {
      const key = process.env.DEEPSEEK_API_KEY?.trim();
      if (key && key.length > 20 && key.startsWith('sk-')) {
        PROVIDERS.deepseek.enabled = true;
        console.log('✅ DeepSeek configurado');
      } else {
        console.log('⚠️  DeepSeek não configurado');
      }
    }
  },
  
  // ===== Qwen =====
  qwen: {
    name: 'Qwen (Alibaba)',
    enabled: false,
    endpoint: 'https://dashscope.aliyuncs.com/api/v1',
    model: process.env.QWEN_MODEL || 'qwen-max',
    init: () => {
      const key = process.env.QWEN_API_KEY?.trim();
      if (key && key.length > 10) {
        PROVIDERS.qwen.enabled = true;
        console.log('✅ Qwen configurado');
      } else {
        console.log('⚠️  Qwen não configurado');
      }
    }
  },
  
  // ===== Google Gemini =====
  gemini: {
    name: 'Google Gemini',
    enabled: false,
    client: null,
    init: () => {
      const key = process.env.GEMINI_API_KEY?.trim();
      if (key && key.length > 20 && key.startsWith('AIza')) {
        try {
          PROVIDERS.gemini.client = new GoogleGenerativeAI(key);
          PROVIDERS.gemini.enabled = true;
          console.log('✅ Google Gemini configurado');
        } catch (error) {
          console.log('⚠️  Google Gemini: erro ao inicializar:', error.message);
        }
      } else {
        console.log('⚠️  Google Gemini não configurado');
      }
    }
  },
  
  // ===== Azure Copilot =====
  copilot: {
    name: 'Microsoft Copilot (Azure)',
    enabled: false,
    client: null,
    init: () => {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
      const key = process.env.AZURE_OPENAI_KEY?.trim();
      if (endpoint && key && endpoint.includes('openai.azure.com')) {
        try {
          PROVIDERS.copilot.client = new OpenAI({
            apiKey: key,
            baseURL: `${endpoint}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4'}`,
            defaultQuery: { 'api-version': '2024-02-15-preview' },
            defaultHeaders: { 'api-key': key }
          });
          PROVIDERS.copilot.enabled = true;
          console.log('✅ Azure Copilot configurado');
        } catch (error) {
          console.log('⚠️  Azure Copilot: erro ao inicializar:', error.message);
        }
      } else {
        console.log('⚠️  Azure Copilot não configurado');
      }
    }
  },
  
  // ===== Google AI Studio =====
  google: {
    name: 'Google AI Studio',
    enabled: false,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    init: () => {
      const key = process.env.GOOGLE_AI_STUDIO_KEY?.trim();
      if (key && key.length > 10) {
        PROVIDERS.google.enabled = true;
        console.log('✅ Google AI Studio configurado');
      } else {
        console.log('⚠️  Google AI Studio não configurado');
      }
    }
  },
  
  // ===== Anthropic Claude =====
  claude: {
    name: 'Anthropic Claude',
    enabled: false,
    client: null,
    init: () => {
      const key = process.env.CLAUDE_API_KEY?.trim();
      if (key && key.length > 20 && key.startsWith('sk-ant-')) {
        try {
          PROVIDERS.claude.client = new Anthropic({ apiKey: key });
          PROVIDERS.claude.enabled = true;
          console.log('✅ Anthropic Claude configurado');
        } catch (error) {
          console.log('⚠️  Anthropic Claude: erro ao inicializar:', error.message);
        }
      } else {
        console.log('⚠️  Anthropic Claude não configurado');
      }
    }
  }
};

// ===== INICIALIZAÇÃO DOS PROVIDERS =====
console.log('\n🔧 Inicializando providers AI...');
Object.values(PROVIDERS).forEach(p => { if (p.init) p.init(); });

// Contar providers disponíveis
const availableCount = Object.values(PROVIDERS).filter(p => p.enabled).length;
console.log(`📦 ${availableCount} provider(s) disponível(is)\n`);

// ===== MEMORY DO CHAT =====
const chatMemory = new Map();

// ===== SYSTEM PROMPT =====
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
  
  // NVIDIA: Adiciona cada modelo como um provider separado
  if (PROVIDERS.nvidia.enabled) {
    const icons = {
      'llama': '🦙', 'nemotron': '⚡', 'qwen': '🔷', 'deepseek': '🔶',
      'gemma': '💎', 'mistral': '🌪️', 'default': '🔵'
    };
    
    PROVIDERS.nvidia.chatModels.forEach(modelId => {
      const icon = Object.entries(icons).find(([k]) => modelId.toLowerCase().includes(k))?.[1] || icons.default;
      const modelName = modelId.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || modelId;
      
      providers.push({
        id: `nvidia:${modelId}`,
        name: `${icon} ${modelName}`,
        available: true,
        provider: 'nvidia',
        model: modelId,
        description: `NVIDIA NIM: ${modelName}`
      });
    });
  }
  
  // Outros providers (simplificado)
  if (PROVIDERS.openai.enabled) {
    providers.push({ id: 'openai', name: '🟢 OpenAI GPT-4', available: true, provider: 'openai' });
  }
  if (PROVIDERS.deepseek.enabled) {
    providers.push({ id: 'deepseek', name: '🟡 DeepSeek', available: true, provider: 'deepseek' });
  }
  if (PROVIDERS.qwen.enabled) {
    providers.push({ id: 'qwen', name: '🔴 Qwen', available: true, provider: 'qwen' });
  }
  if (PROVIDERS.gemini.enabled) {
    providers.push({ id: 'gemini', name: '🟣 Gemini', available: true, provider: 'gemini' });
  }
  if (PROVIDERS.copilot.enabled) {
    providers.push({ id: 'copilot', name: '🔷 Copilot', available: true, provider: 'copilot' });
  }
  if (PROVIDERS.google.enabled) {
    providers.push({ id: 'google', name: '🔶 AI Studio', available: true, provider: 'google' });
  }
  if (PROVIDERS.claude.enabled) {
    providers.push({ id: 'claude', name: '🟠 Claude', available: true, provider: 'claude' });
  }
  
  // Fallback para demo
  if (providers.length === 0) {
    providers.push({ id: 'demo', name: '🔧 Modo Demo', available: true, provider: 'demo' });
  }
  
  return providers;
};

export const switchProvider = (providerId) => {
  // Formato NVIDIA: "nvidia:model_id"
  if (providerId?.startsWith('nvidia:')) {
    const modelId = providerId.replace('nvidia:', '');
    if (PROVIDERS.nvidia.enabled && PROVIDERS.nvidia.chatModels.includes(modelId)) {
      process.env.NVIDIA_CURRENT_MODEL = modelId;
      process.env.AI_PROVIDER = providerId;
      return { success: true, model: modelId, provider: 'nvidia' };
    }
    return { success: false, error: `Modelo "${modelId}" não disponível` };
  }
  
  // Demo
  if (providerId === 'demo') {
    process.env.AI_PROVIDER = 'demo';
    return { success: true };
  }
  
  // Outros providers
  if (PROVIDERS[providerId]?.enabled) {
    process.env.AI_PROVIDER = providerId;
    return { success: true };
  }
  
  return { success: false, error: `Provider "${providerId}" não encontrado ou configurado` };
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

// ===== HANDLERS POR PROVIDER =====

const callNVIDIA = async (messages, modelId) => {
  const endpoint = `${PROVIDERS.nvidia.endpoint}/chat/completions`;
  
  console.log(`🤖 [NVIDIA] Chamando: ${modelId}`);
  
  const response = await axios.post(endpoint, {
    model: modelId,
    messages,
    max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3,
    stream: false
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY?.trim()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 60000
  });
  
  return response.data.choices?.[0]?.message?.content || 'Sem resposta do modelo.';
};

const callOpenAI = async (messages) => {
  const client = PROVIDERS.openai.client;
  if (!client) throw new Error('OpenAI client não inicializado');
  
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo',
    messages,
    max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
  });
  return response.choices[0].message.content;
};

const callDeepSeek = async (messages) => {
  const response = await axios.post(
    `${PROVIDERS.deepseek.endpoint}/chat/completions`,
    {
      model: PROVIDERS.deepseek.model,
      messages,
      max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY?.trim()}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  return response.data.choices[0].message.content;
};

const callQwen = async (messages) => {
  const response = await axios.post(
    `${PROVIDERS.qwen.endpoint}/services/aigc/text-generation/generation`,
    {
      model: PROVIDERS.qwen.model,
      input: { messages },
      parameters: {
        result_format: 'message',
        max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.QWEN_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      timeout: 30000
    }
  );
  return response.data.output?.choices?.[0]?.message?.content || 'Sem resposta.';
};

const callGemini = async (messages) => {
  const model = PROVIDERS.gemini.client.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL || 'gemini-pro' 
  });
  
  const prompt = messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n\n');
  
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
    }
  });
  
  return result.response?.text() || 'Sem resposta.';
};

const callCopilot = async (messages) => {
  const client = PROVIDERS.copilot.client;
  if (!client) throw new Error('Copilot client não inicializado');
  
  const response = await client.chat.completions.create({
    messages,
    max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
  });
  return response.choices[0].message.content;
};

const callGoogleAIStudio = async (messages) => {
  const response = await axios.post(
    `${PROVIDERS.google.endpoint}/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_STUDIO_KEY?.trim()}`,
    {
      contents: messages.filter(m => m.role === 'user').map(m => ({
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        maxOutputTokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
      }
    },
    { timeout: 30000 }
  );
  return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';
};

const callClaude = async (messages) => {
  const client = PROVIDERS.claude.client;
  if (!client) throw new Error('Claude client não inicializado');
  
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const claudeMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));
  
  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
    system: systemMessage,
    messages: claudeMessages,
    max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
  });
  
  return response.content?.[0]?.text || 'Sem resposta.';
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

${PROVIDERS.nvidia.chatModels.map(m => `• 🔵 ${m.split('/').pop()}`).join('\n') || '• Aguardando configuração'}

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
  if (!provider || provider === 'demo' || !PROVIDERS.nvidia.enabled) {
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
  let modelId = PROVIDERS.nvidia.defaultModel;
  let providerName = 'NVIDIA NIM';
  
  if (provider?.startsWith('nvidia:')) {
    modelId = provider.replace('nvidia:', '');
    const modelName = modelId.split('/').pop()?.replace(/-/g, ' ');
    providerName = modelName ? `NVIDIA: ${modelName}` : 'NVIDIA NIM';
  }
  
  const messages = [
    { role: 'system', content: getSystemPrompt(context) },
    ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage }
  ];
  
  saveToHistory(userId, 'user', userMessage);
  
  try {
    console.log(`🤖 Processando com: ${providerName} (${modelId})`);
    
    let response;
    
    if (provider?.startsWith('nvidia:')) {
      response = await callNVIDIA(messages, modelId);
    } else if (provider === 'openai') {
      response = await callOpenAI(messages);
    } else if (provider === 'deepseek') {
      response = await callDeepSeek(messages);
    } else if (provider === 'qwen') {
      response = await callQwen(messages);
    } else if (provider === 'gemini') {
      response = await callGemini(messages);
    } else if (provider === 'copilot') {
      response = await callCopilot(messages);
    } else if (provider === 'google') {
      response = await callGoogleAIStudio(messages);
    } else if (provider === 'claude') {
      response = await callClaude(messages);
    } else {
      throw new Error(`Provider "${provider}" não implementado`);
    }
    
    saveToHistory(userId, 'assistant', response);
    
    return {
      message: response,
      provider: providerName,
      timestamp: new Date().toISOString(),
      meta: { model: modelId }
    };
    
  } catch (error) {
    console.error(`❌ Erro em ${provider}:`, error.message);
    
    const fallback = `⚠️ **Erro ao processar**

Detalhes: ${error.message}

Tente:
1. Verificar sua conexão com a internet
2. Confirmar que o modelo está disponível
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