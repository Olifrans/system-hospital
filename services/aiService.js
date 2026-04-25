import axios from 'axios';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ===== CONFIGURAÇÃO DOS PROVIDERS =====
const PROVIDERS = {
  nvidia: {
    name: 'NVIDIA NIM',
    enabled: false,
    endpoint: 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
    init: () => {
      const key = process.env.NVIDIA_API_KEY;
      if (key && key !== 'nvapi-TTTTT' && key.length > 10) {
        PROVIDERS.nvidia.enabled = true;
        console.log('✅ NVIDIA NIM configurado');
      } else {
        console.log('⚠️  NVIDIA NIM não configurado (chave inválida)');
      }
    }
  },
  openai: {
    name: 'OpenAI (GPT)',
    enabled: false,
    client: null,
    init: () => {
      const key = process.env.OPENAI_API_KEY;
      if (key && !key.includes('xxxxxxxx') && key.startsWith('sk-')) {
        try {
          PROVIDERS.openai.client = new OpenAI({ apiKey: key });
          PROVIDERS.openai.enabled = true;
          console.log('✅ OpenAI configurado');
        } catch (error) {
          console.log('⚠️  OpenAI: erro ao inicializar cliente');
        }
      } else {
        console.log('⚠️  OpenAI não configurado (chave ausente ou inválida)');
      }
    }
  },
  deepseek: {
    name: 'DeepSeek',
    enabled: false,
    endpoint: 'https://api.deepseek.com/v1',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    init: () => {
      const key = process.env.DEEPSEEK_API_KEY;
      if (key && !key.includes('xxxxxxxx') && key.startsWith('sk-')) {
        PROVIDERS.deepseek.enabled = true;
        console.log('✅ DeepSeek configurado');
      } else {
        console.log('⚠️  DeepSeek não configurado');
      }
    }
  },
  qwen: {
    name: 'Qwen (Alibaba)',
    enabled: false,
    endpoint: 'https://dashscope.aliyuncs.com/api/v1',
    model: process.env.QWEN_MODEL || 'qwen-max',
    init: () => {
      const key = process.env.QWEN_API_KEY;
      if (key && !key.includes('xxxxxxxx')) {
        PROVIDERS.qwen.enabled = true;
        console.log('✅ Qwen configurado');
      } else {
        console.log('⚠️  Qwen não configurado');
      }
    }
  },
  gemini: {
    name: 'Google Gemini',
    enabled: false,
    client: null,
    init: () => {
      const key = process.env.GEMINI_API_KEY;
      if (key && !key.includes('xxxxxxxx') && key.startsWith('AIza')) {
        try {
          PROVIDERS.gemini.client = new GoogleGenerativeAI(key);
          PROVIDERS.gemini.enabled = true;
          console.log('✅ Google Gemini configurado');
        } catch (error) {
          console.log('⚠️  Google Gemini: erro ao inicializar');
        }
      } else {
        console.log('⚠️  Google Gemini não configurado');
      }
    }
  },
  copilot: {
    name: 'Microsoft Copilot (Azure)',
    enabled: false,
    client: null,
    init: () => {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const key = process.env.AZURE_OPENAI_KEY;
      if (endpoint && key && !endpoint.includes('your-resource')) {
        try {
          PROVIDERS.copilot.client = new OpenAI({
            apiKey: key,
            baseURL: `${endpoint}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
            defaultQuery: { 'api-version': '2024-02-15-preview' },
            defaultHeaders: { 'api-key': key }
          });
          PROVIDERS.copilot.enabled = true;
          console.log('✅ Azure Copilot configurado');
        } catch (error) {
          console.log('⚠️  Azure Copilot: erro ao inicializar');
        }
      } else {
        console.log('⚠️  Azure Copilot não configurado');
      }
    }
  },
  google: {
    name: 'Google AI Studio',
    enabled: false,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    init: () => {
      const key = process.env.GOOGLE_AI_STUDIO_KEY;
      if (key && !key.includes('xxxxxxxx')) {
        PROVIDERS.google.enabled = true;
        console.log('✅ Google AI Studio configurado');
      } else {
        console.log('⚠️  Google AI Studio não configurado');
      }
    }
  },
  claude: {
    name: 'Anthropic Claude',
    enabled: false,
    client: null,
    init: () => {
      const key = process.env.CLAUDE_API_KEY;
      if (key && !key.includes('xxxxxxxx') && key.startsWith('sk-ant-')) {
        try {
          PROVIDERS.claude.client = new Anthropic({ apiKey: key });
          PROVIDERS.claude.enabled = true;
          console.log('✅ Anthropic Claude configurado');
        } catch (error) {
          console.log('⚠️  Anthropic Claude: erro ao inicializar');
        }
      } else {
        console.log('⚠️  Anthropic Claude não configurado');
      }
    }
  }
};

// Inicializar todos os providers
console.log('\n🔧 Inicializando providers AI...');
Object.values(PROVIDERS).forEach(p => {
  if (p.init) p.init();
});

// Verificar quantos estão disponíveis
const availableCount = Object.values(PROVIDERS).filter(p => p.enabled).length;
console.log(`📦 ${availableCount} provider(s) disponível(is)\n`);

// ===== MEMORY DO CHAT =====
const chatMemory = new Map();

const getSystemPrompt = (context = {}) => {
  const hospitalContext = context.hospital || 'Hospital Central São Lucas';
  const userRole = context.role || 'profissional de saúde';
  
  return `Você é ${process.env.CHATBOT_NAME || 'MedAssistente'}, um assistente de IA especializado em gestão hospitalar.

CONTEXTO:
- Hospital: ${hospitalContext}
- Usuário: ${userRole}
- Data atual: ${new Date().toLocaleDateString('pt-BR')}

DIRETRIZES:
1. Seja profissional, empático e preciso
2. Forneça informações baseadas em práticas médicas
3. NUNCA substitua o julgamento clínico profissional
4. Para emergências, oriente atendimento imediato
5. Mantenha confidencialidade
6. Use português do Brasil claro

Responda de forma concisa e útil.`;
};

// ===== FUNÇÕES PRINCIPAIS =====

export const getAvailableProviders = () => {
  const available = Object.entries(PROVIDERS)
    .filter(([_, config]) => config.enabled)
    .map(([key, config]) => ({
      id: key,
      name: config.name,
      available: true
    }));
  
  // Sempre adicionar modo demo como fallback
  if (available.length === 0) {
    available.push({ id: 'demo', name: '🔧 Modo Demo', available: true });
  }
  
  return available;
};

export const switchProvider = (providerId) => {
  if (!PROVIDERS[providerId] && providerId !== 'demo') {
    return { success: false, error: `Provider "${providerId}" não encontrado` };
  }
  
  if (providerId !== 'demo' && !PROVIDERS[providerId].enabled) {
    return { success: false, error: `Provider "${providerId}" não está configurado` };
  }
  
  process.env.AI_PROVIDER = providerId;
  return { success: true };
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
  if (!chatMemory.has(userId)) {
    chatMemory.set(userId, []);
  }
  const history = chatMemory.get(userId);
  history.push({ role, content, timestamp: new Date().toISOString() });
  
  if (history.length > 100) {
    history.shift();
  }
};

// ===== HANDLERS POR PROVIDER =====

const callNVIDIA = async (messages, config) => {
  const response = await axios.post(
    `${PROVIDERS.nvidia.endpoint}/chat/completions`,
    {
      model: PROVIDERS.nvidia.model,
      messages,
      max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  return response.data.choices[0].message.content;
};

const callOpenAI = async (messages, config) => {
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

const callDeepSeek = async (messages, config) => {
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
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  return response.data.choices[0].message.content;
};

const callQwen = async (messages, config) => {
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
        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'disable'
      },
      timeout: 30000
    }
  );
  return response.data.output.choices[0].message.content;
};

const callGemini = async (messages, config) => {
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
  
  return result.response.text();
};

const callCopilot = async (messages, config) => {
  const client = PROVIDERS.copilot.client;
  if (!client) throw new Error('Copilot client não inicializado');
  
  const response = await client.chat.completions.create({
    messages,
    max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3
  });
  return response.choices[0].message.content;
};

const callGoogleAIStudio = async (messages, config) => {
  const response = await axios.post(
    `${PROVIDERS.google.endpoint}/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_STUDIO_KEY}`,
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
  return response.data.candidates[0].content.parts[0].text;
};

const callClaude = async (messages, config) => {
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
  
  return response.content[0].text;
};

// ===== MODO DEMO =====
const getMockResponse = (userMessage, context) => {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('consulta') || msg.includes('agendar')) {
    return `📅 **Agendamento de Consultas**
    
Para agendar:
1. Acesse "Consultas" no menu
2. Clique em "+ Agendar Consulta"
3. Preencha os dados
4. Selecione médico e horário

Precisa de ajuda com algo específico?`;
  }
  else if (msg.includes('paciente') || msg.includes('cadastrar')) {
    return `👥 **Cadastro de Pacientes**
    
1. Vá em "Pacientes"
2. Clique em "+ Novo Paciente"
3. Preencha:
   - Nome completo
   - CPF
   - Data de nascimento
   - Telefone
   - Convênio

Dúvidas?`;
  }
  else if (msg.includes('relatório') || msg.includes('métrica')) {
    return `📊 **Relatórios Disponíveis**
    
• Dashboard: visão geral
• Atendimentos: por período
• Pacientes: ativos/inativos
• Financeiro: consultas realizadas
• Produtividade: por médico

Qual deseja ver?`;
  }
  else {
    return `🏥 **MedAssistente - Modo Demo**

Posso ajudar com:
📅 Consultas: agendamento, cancelamento
👥 Pacientes: cadastro, busca
👨‍️ Médicos: escala, especialidades
📊 Relatórios: métricas, estatísticas
🎫 Atendimentos: triagem, prioridade

**Para usar AI real:**
Configure uma chave de API no arquivo \`.env\`

Providers disponíveis:
${Object.entries(PROVIDERS)
  .filter(([_, p]) => p.enabled)
  .map(([k, p]) => `• ${p.name}`)
  .join('\n') || '• Nenhum provider configurado'}

Como posso ajudar?`;
  }
};

// ===== FUNÇÃO PRINCIPAL =====

export const sendMessage = async (userMessage, options = {}) => {
  const { context = {}, provider = process.env.AI_PROVIDER, userId = 'anonymous' } = options;
  
  console.log(`📩 Mensagem recebida:`, { message: userMessage.substring(0, 30) + '...', provider });
  
  // Se for demo ou provider não disponível
  if (provider === 'demo' || !PROVIDERS[provider]?.enabled) {
    console.log('🔧 Usando modo demo');
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

  const messages = [
    { role: 'system', content: getSystemPrompt(context) },
    ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage }
  ];

  saveToHistory(userId, 'user', userMessage);

  try {
    console.log(`🤖 Processando com provider: ${provider}`);
    
    let response;
    let providerName = PROVIDERS[provider].name;

    switch (provider) {
      case 'nvidia':
        response = await callNVIDIA(messages, options);
        break;
      case 'openai':
        response = await callOpenAI(messages, options);
        break;
      case 'deepseek':
        response = await callDeepSeek(messages, options);
        break;
      case 'qwen':
        response = await callQwen(messages, options);
        break;
      case 'gemini':
        response = await callGemini(messages, options);
        break;
      case 'copilot':
        response = await callCopilot(messages, options);
        break;
      case 'google':
        response = await callGoogleAIStudio(messages, options);
        break;
      case 'claude':
        response = await callClaude(messages, options);
        break;
      default:
        throw new Error(`Provider "${provider}" não implementado`);
    }

    saveToHistory(userId, 'assistant', response);

    return {
      message: response,
      provider: providerName,
      timestamp: new Date().toISOString(),
      meta: {
        model: process.env[`${provider.toUpperCase()}_MODEL`] || 'default'
      }
    };

  } catch (error) {
    console.error(`❌ Erro no provider ${provider}:`, error.message);
    
    // Fallback para demo
    const response = getMockResponse(userMessage, context);
    saveToHistory(userId, 'assistant', response);
    
    return {
      message: response + `\n\n⚠️ *Nota: Erro no provider ${provider}. Usando modo demo.*`,
      provider: 'Modo Demo (Fallback)',
      timestamp: new Date().toISOString(),
      meta: { error: error.message, fallback: true }
    };
  }
};