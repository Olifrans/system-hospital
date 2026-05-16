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
            const rawKey = process.env.NVIDIA_API_KEY;
            const key = rawKey?.trim();
            const modelsEnv = process.env.NVIDIA_CHAT_MODELS || '';

            console.log('🔍 [NVIDIA] Debug da configuração:');
            console.log('   Chave presente:', !!rawKey);
            console.log('   Chave length (bruta):', rawKey?.length);
            console.log('   Chave length (trim):', key?.length);
            console.log('   Começa com nvapi-:', key?.startsWith('nvapi-'));
            console.log('   Primeiros 20 chars:', key?.substring(0, 20));

            // Validação permissiva: chave NVIDIA típica tem ~88 chars
            if (key && key.length >= 50 && key.startsWith('nvapi-')) {
                PROVIDERS.nvidia.enabled = true;
                PROVIDERS.nvidia.chatModels = modelsEnv
                    ? modelsEnv.split(',').map(m => m.trim()).filter(Boolean)
                    : [PROVIDERS.nvidia.defaultModel];
                console.log('✅ NVIDIA NIM HABILITADO');
                console.log(`   📦 Modelos: ${PROVIDERS.nvidia.chatModels.join(', ')}`);
            } else {
                console.log('⚠️ NVIDIA NIM: chave inválida ou ausente');
                if (key) {
                    console.log(`   💡 Dica: chave tem ${key.length} chars, mínimo recomendado: 50`);
                }
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
            if (key && (key.startsWith('sk-') || key.startsWith('sk-proj-')) && key.length > 20) {
                try {
                    PROVIDERS.openai.client = new OpenAI({ apiKey: key });
                    PROVIDERS.openai.enabled = true;
                    console.log('✅ OpenAI habilitado');
                } catch (e) { console.log('⚠️ OpenAI: erro ao inicializar', e.message); }
            } else { console.log('⚠️ OpenAI desabilitado'); }
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
            if (key && key.startsWith('sk-') && key.length > 20) {
                PROVIDERS.deepseek.enabled = true;
                console.log('✅ DeepSeek habilitado');
            } else { console.log('⚠️ DeepSeek desabilitado'); }
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
                console.log('✅ Qwen habilitado');
            } else { console.log('⚠️ Qwen desabilitado'); }
        }
    },

    // ===== Google Gemini =====
    gemini: {
        name: 'Google Gemini',
        enabled: false,
        client: null,
        init: () => {
            const key = process.env.GEMINI_API_KEY?.trim();
            if (key && key.startsWith('AIza') && key.length > 20) {
                try {
                    PROVIDERS.gemini.client = new GoogleGenerativeAI(key);
                    PROVIDERS.gemini.enabled = true;
                    console.log('✅ Google Gemini habilitado');
                } catch (e) { console.log('⚠️ Gemini: erro ao inicializar', e.message); }
            } else { console.log('⚠️ Google Gemini desabilitado'); }
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
                    console.log('✅ Azure Copilot habilitado');
                } catch (e) { console.log('⚠️ Copilot: erro ao inicializar', e.message); }
            } else { console.log('⚠️ Azure Copilot desabilitado'); }
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
                console.log('✅ Google AI Studio habilitado');
            } else { console.log('⚠️ Google AI Studio desabilitado'); }
        }
    },

    // ===== Anthropic Claude =====
    claude: {
        name: 'Anthropic Claude',
        enabled: false,
        client: null,
        init: () => {
            const key = process.env.CLAUDE_API_KEY?.trim();
            if (key && key.startsWith('sk-ant-') && key.length > 20) {
                try {
                    PROVIDERS.claude.client = new Anthropic({ apiKey: key });
                    PROVIDERS.claude.enabled = true;
                    console.log('✅ Anthropic Claude habilitado');
                } catch (e) { console.log('⚠️ Claude: erro ao inicializar', e.message); }
            } else { console.log('⚠️ Anthropic Claude desabilitado'); }
        }
    }
};

// ===== INICIALIZAÇÃO SÍNCRONA =====
console.log('\n🔧 Inicializando providers AI...');
Object.values(PROVIDERS).forEach(p => p.init?.());
const enabledCount = Object.values(PROVIDERS).filter(p => p.enabled).length;
console.log(`📦 ${enabledCount} provider(s) pronto(s)\n`);

// ===== MEMORY & HELPERS =====
const chatMemory = new Map();

const saveToHistory = (userId, role, content) => {
    if (!chatMemory.has(userId)) chatMemory.set(userId, []);
    const h = chatMemory.get(userId);
    h.push({ role, content, timestamp: new Date().toISOString() });
    if (h.length > 100) h.shift();
};

// ===== SYSTEM PROMPT =====
const getSystemPrompt = (context = {}) => `Você é ${process.env.CHATBOT_NAME || 'MedAssistente'}, assistente de IA especializado em saúde, medicina e gestão hospitalar.

🎯 CAPACIDADES:
1. SAÚDE E MEDICINA: dúvidas sobre doenças, sintomas, tratamentos, prevenção, medicamentos, exames, nutrição, saúde mental.
2. GESTÃO HOSPITALAR: agendamentos, cadastros, escalas, relatórios, triagem.

📋 DIRETRIZES:
✅ Seja claro, empático e baseie-se em evidências científicas.
✅ Use português do Brasil. Explique termos técnicos.
✅ Para emergências, oriente atendimento imediato.
❌ NÃO dê diagnósticos definitivos, NÃO prescreva medicamentos, NÃO substitua médicos.
⚠️ Inclua sempre: "Esta informação é educacional. Consulte um profissional de saúde."

CONTEXTO: Hospital ${context.hospital || 'Central'} | Usuário: ${context.role || 'geral'} | Data: ${new Date().toLocaleDateString('pt-BR')}`;

// ===== PROVIDERS LIST =====
export const getAvailableProviders = () => {
    const list = [];
    if (PROVIDERS.nvidia.enabled) {
        const icons = { llama: '🦙', nemotron: '⚡', qwen: '🔷', deepseek: '🔶', gemma: '💎', mistral: '🌪️' };
        PROVIDERS.nvidia.chatModels.forEach(m => {
            const icon = Object.entries(icons).find(([k]) => m.toLowerCase().includes(k))?.[1] || '🔵';
            list.push({ id: `nvidia:${m}`, name: `${icon} ${m.split('/').pop().replace(/-/g, ' ')}`, provider: 'nvidia', model: m });
        });
    }
    if (PROVIDERS.openai.enabled) list.push({ id: 'openai', name: '🟢 OpenAI GPT-4', provider: 'openai' });
    if (PROVIDERS.deepseek.enabled) list.push({ id: 'deepseek', name: '🟡 DeepSeek', provider: 'deepseek' });
    if (PROVIDERS.qwen.enabled) list.push({ id: 'qwen', name: '🔴 Qwen', provider: 'qwen' });
    if (PROVIDERS.gemini.enabled) list.push({ id: 'gemini', name: '🟣 Gemini', provider: 'gemini' });
    if (PROVIDERS.copilot.enabled) list.push({ id: 'copilot', name: '🔷 Copilot', provider: 'copilot' });
    if (PROVIDERS.google.enabled) list.push({ id: 'google', name: '🔶 AI Studio', provider: 'google' });
    if (PROVIDERS.claude.enabled) list.push({ id: 'claude', name: '🟠 Claude', provider: 'claude' });
    return list.length ? list : [{ id: 'demo', name: '🔧 Modo Demo', provider: 'demo' }];
};

export const switchProvider = (id) => {
    if (id?.startsWith('nvidia:')) {
        const m = id.replace('nvidia:', '');
        if (PROVIDERS.nvidia.enabled && PROVIDERS.nvidia.chatModels.includes(m)) {
            process.env.NVIDIA_CURRENT_MODEL = m; process.env.AI_PROVIDER = id;
            return { success: true, model: m };
        }
        return { success: false, error: 'Modelo não disponível' };
    }
    if (id === 'demo') { process.env.AI_PROVIDER = 'demo'; return { success: true }; }
    if (PROVIDERS[id]?.enabled) { process.env.AI_PROVIDER = id; return { success: true }; }
    return { success: false, error: 'Provider inválido' };
};

export const getChatHistory = (u, l = 50) => (chatMemory.get(u) || []).slice(-l);
export const clearChatHistory = (u) => { chatMemory.delete(u); return true; };

// ===== HANDLERS =====
const callNVIDIA = async (msgs, model, apiKey) => {
    const res = await axios.post(`${PROVIDERS.nvidia.endpoint}/chat/completions`, {
        model, messages: msgs, max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3, stream: false
    }, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000
    });
    return res.data.choices?.[0]?.message?.content || 'Sem resposta.';
};

const callOpenAI = async (msgs) => (await PROVIDERS.openai.client.chat.completions.create({
    model: 'gpt-4-turbo', messages: msgs, max_tokens: 2000, temperature: 0.3
})).choices[0].message.content;

const callDeepSeek = async (msgs) => (await axios.post(`${PROVIDERS.deepseek.endpoint}/chat/completions`, {
    model: PROVIDERS.deepseek.model, messages: msgs, max_tokens: 2000, temperature: 0.3
}, { headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY.trim()}` }, timeout: 30000 })).data.choices[0].message.content;

const callQwen = async (msgs) => (await axios.post(`${PROVIDERS.qwen.endpoint}/services/aigc/text-generation/generation`, {
    model: PROVIDERS.qwen.model, input: { messages: msgs }, parameters: { result_format: 'message', max_tokens: 2000, temperature: 0.3 }
}, { headers: { Authorization: `Bearer ${process.env.QWEN_API_KEY.trim()}`, 'X-DashScope-SSE': 'disable' }, timeout: 30000 })).data.output?.choices?.[0]?.message?.content || 'Sem resposta.';

const callGemini = async (msgs) => {
    const prompt = msgs.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n\n');
    return (await PROVIDERS.gemini.client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro' }).generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.3 }
    })).response?.text() || 'Sem resposta.';
};

const callCopilot = async (msgs) => (await PROVIDERS.copilot.client.chat.completions.create({
    messages: msgs, max_tokens: 2000, temperature: 0.3
})).choices[0].message.content;

const callGoogleAI = async (msgs) => (await axios.post(
    `${PROVIDERS.google.endpoint}/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_STUDIO_KEY.trim()}`,
    { contents: msgs.filter(m => m.role === 'user').map(m => ({ parts: [{ text: m.content }] })), generationConfig: { maxOutputTokens: 2000, temperature: 0.3 } },
    { timeout: 30000 }
)).data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';

const callClaude = async (msgs) => {
    const sys = msgs.find(m => m.role === 'system')?.content || '';
    const cMsgs = msgs.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    return (await PROVIDERS.claude.client.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229', system: sys, messages: cMsgs, max_tokens: 2000, temperature: 0.3
    })).content[0].text;
};

// ===== MODO DEMO =====
const getMockResponse = (q) => {
    const qL = q.toLowerCase();

    // Respostas hardcoded para temas comuns
    if (qL.includes('covid') || qL.includes('corona')) return `🦠 **COVID-19**: Doença respiratória causada pelo SARS-CoV-2. Sintomas: febre, tosse, cansaço, perda de olfato/paladar. Prevenção: vacina, máscara, higiene. Tratamento: repouso, hidratação. Casos graves exigem hospital. ⚠️ Procure médico se faltar ar.`;
    if (qL.includes('diabetes')) return `🩺 **Diabetes**: Incapacidade de metabolizar glicose. Tipo 1 (autoimune), Tipo 2 (resistência à insulina). Sintomas: sede excessiva, urina frequente, fadiga. Controle: dieta, exercício, monitoramento, medicação. ⚠️ Acompanhamento médico regular é essencial.`;
    if (qL.includes('pressão') || qL.includes('hiperten')) return `❤️ **Hipertensão**: Pressão arterial ≥140/90 mmHg. Riscos: AVC, infarto, renal. Controle: reduzir sal, exercício, peso, evitar álcool/cigarro, medicamentos. ⚠️ Meça regularmente e siga orientação médica.`;
    if (qL.includes('consulta') || qL.includes('agenda')) return `📅 **Agendamento**: Menu "Consultas" → "+ Nova Consulta". Selecione paciente, médico, data/hora. Chegue 15min antes com documentos e convênio.`;
    if (qL.includes('paciente') || qL.includes('cadastro')) return `👥 **Cadastro**: Menu "Pacientes" → "+ Novo". Preencha nome, CPF, nascimento, telefone, convênio, sangue. ID gerado automaticamente.`;
    if (qL.includes('relatório')) return `📊 **Relatórios**: Menu "Relatórios". Filtre por período/especialidade. Exporte em PDF/Excel. Inclui atendimentos, pacientes, financeiro e produtividade.`;

    // Fallback genérico para saúde
    const healthKeywords = ['vírus', 'bactéria', 'doença', 'sintoma', 'tratamento', 'medicamento', 'exame', 'diagnóstico', 'prevenção', 'vacina', 'infecção', 'câncer', 'coração', 'asma', 'alergia', 'gripe'];
    if (healthKeywords.some(k => qL.includes(k))) {
        const topic = qL.match(/(?:o que é|sobre|fale sobre)\s+([a-zá-ú]+)/)?.[1] || 'este tema';
        return `🔍 **Sobre ${topic}**\n\nEsta é uma resposta educacional. Para orientações específicas sobre diagnóstico ou tratamento, **consulte um médico**.\n\n📋 Fontes confiáveis:\n• Ministério da Saúde: www.gov.br/saude\n• OMS: www.who.int\n\n💡 Posso ajudar com:\n- Agendar consultas\n- Cadastrar pacientes\n- Verificar escalas\n- Gerar relatórios\n\nComo posso auxiliar?`;
    }

    return `🏥 **MedAssistente - Modo Demo**\n\nSem conexão com IA no momento. Posso ajudar com:\n🩺 Informações básicas (COVID, Diabetes, Pressão, Agendamentos, Cadastros, Relatórios)\n📋 Gestão do sistema hospitalar\n\n⚠️ Para dúvidas médicas específicas, consulte um profissional ou configure uma chave de API.\n\nComo posso ajudar?`;
};

// ===== FUNÇÃO PRINCIPAL =====
export const sendMessage = async (userMessage, options = {}) => {
    const { context = {}, provider, userId = 'anonymous' } = options;
    console.log(`📩 Msg: ${userMessage.substring(0, 40)}... | Prov: ${provider}`);

    // 1. TENTATIVA DIRETA NVIDIA (IGNORA FLAG ENABLED SE HOUVER CHAVE VÁLIDA)
    const nvidiaKey = process.env.NVIDIA_API_KEY?.trim();
    if (nvidiaKey && nvidiaKey.startsWith('nvapi-') && nvidiaKey.length >= 50) {
        try {
            const model = provider?.startsWith('nvidia:')
                ? provider.replace('nvidia:', '')
                : (process.env.NVIDIA_DEFAULT_MODEL || 'meta/llama-3.1-70b-instruct');

            const msgs = [
                { role: 'system', content: getSystemPrompt(context) },
                ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })),
                { role: 'user', content: userMessage }
            ];
            saveToHistory(userId, 'user', userMessage);

            console.log(`🚀 Chamando NVIDIA API direto: ${model}`);
            const res = await axios.post(
                `${process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'}/chat/completions`,
                {
                    model, messages: msgs, max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS) || 2000,
                    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE) || 0.3, stream: false
                },
                {
                    headers: { Authorization: `Bearer ${nvidiaKey}`, 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            const aiText = res.data.choices?.[0]?.message?.content || 'A IA não retornou texto.';
            saveToHistory(userId, 'assistant', aiText);
            console.log('✅ NVIDIA respondeu com sucesso');
            return { message: aiText, provider: `NVIDIA (${model.split('/').pop()})`, timestamp: new Date().toISOString(), meta: { model, fromAPI: true } };
        } catch (e) {
            console.log(`⚠️ Falha NVIDIA API: ${e.message}. Usando fallback.`);
        }
    }

    // 2. OUTROS PROVIDERS (se habilitados)
    if (provider === 'openai' && PROVIDERS.openai.enabled) {
        const msgs = [{ role: 'system', content: getSystemPrompt(context) }, ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }];
        saveToHistory(userId, 'user', userMessage);
        const r = await callOpenAI(msgs); saveToHistory(userId, 'assistant', r);
        return { message: r, provider: 'OpenAI', timestamp: new Date().toISOString() };
    }
    if (provider === 'deepseek' && PROVIDERS.deepseek.enabled) {
        const msgs = [{ role: 'system', content: getSystemPrompt(context) }, ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }];
        saveToHistory(userId, 'user', userMessage);
        const r = await callDeepSeek(msgs); saveToHistory(userId, 'assistant', r);
        return { message: r, provider: 'DeepSeek', timestamp: new Date().toISOString() };
    }
    if (provider === 'qwen' && PROVIDERS.qwen.enabled) {
        const msgs = [{ role: 'system', content: getSystemPrompt(context) }, ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }];
        saveToHistory(userId, 'user', userMessage);
        const r = await callQwen(msgs); saveToHistory(userId, 'assistant', r);
        return { message: r, provider: 'Qwen', timestamp: new Date().toISOString() };
    }
    if (provider === 'gemini' && PROVIDERS.gemini.enabled) {
        const msgs = [{ role: 'system', content: getSystemPrompt(context) }, ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }];
        saveToHistory(userId, 'user', userMessage);
        const r = await callGemini(msgs); saveToHistory(userId, 'assistant', r);
        return { message: r, provider: 'Gemini', timestamp: new Date().toISOString() };
    }
    if (provider === 'copilot' && PROVIDERS.copilot.enabled) {
        const msgs = [{ role: 'system', content: getSystemPrompt(context) }, ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }];
        saveToHistory(userId, 'user', userMessage);
        const r = await callCopilot(msgs); saveToHistory(userId, 'assistant', r);
        return { message: r, provider: 'Copilot', timestamp: new Date().toISOString() };
    }
    if (provider === 'google' && PROVIDERS.google.enabled) {
        const msgs = [{ role: 'system', content: getSystemPrompt(context) }, ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }];
        saveToHistory(userId, 'user', userMessage);
        const r = await callGoogleAI(msgs); saveToHistory(userId, 'assistant', r);
        return { message: r, provider: 'Google AI', timestamp: new Date().toISOString() };
    }
    if (provider === 'claude' && PROVIDERS.claude.enabled) {
        const msgs = [{ role: 'system', content: getSystemPrompt(context) }, ...getChatHistory(userId, 10).map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }];
        saveToHistory(userId, 'user', userMessage);
        const r = await callClaude(msgs); saveToHistory(userId, 'assistant', r);
        return { message: r, provider: 'Claude', timestamp: new Date().toISOString() };
    }

    // 3. FALLBACK DEMO
    const demoRes = getMockResponse(userMessage);
    saveToHistory(userId, 'user', userMessage);
    saveToHistory(userId, 'assistant', demoRes);
    return { message: demoRes, provider: 'Modo Demo', timestamp: new Date().toISOString(), meta: { mock: true } };
};