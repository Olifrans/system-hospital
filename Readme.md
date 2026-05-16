



# Instalar todas as dependências de uma vez com um único comando.


npm i express dotenv axios cors helmet express-rate-limit openai @anthropic-ai/sdk @google/generative-ai
npm i -D nodemon





.env

# # ===== NVIDIA NIM (CONFIGURADO) =====
# NVIDIA_API_KEY=UA_CHAVE_REAL
# NVIDIA_MODEL=meta/llama-3.1-70b-instruct

# # ===== OpenAI (DESATIVADO - chave inválida) =====
# # OPENAI_API_KEY=sk-proj-SUA_CHAVE_REAL_AQUI
# OPENAI_API_KEY=

# # ===== DeepSeek (DESATIVADO) =====
# # DEEPSEEK_API_KEY=sk-SUA_CHAVE_REAL
# DEEPSEEK_API_KEY=

# # ===== Qwen (DESATIVADO) =====
# # QWEN_API_KEY=sk-SUA_CHAVE_REAL
# QWEN_API_KEY=

# # ===== Google Gemini (DESATIVADO) =====
# # GEMINI_API_KEY=SUA_CHAVE_REAL
# GEMINI_API_KEY=

# # ===== Azure Copilot (DESATIVADO) =====
# AZURE_OPENAI_ENDPOINT=
# AZURE_OPENAI_KEY=
# AZURE_DEPLOYMENT_NAME=

# # ===== Google AI Studio (DESATIVADO) =====
# GOOGLE_AI_STUDIO_KEY=

# # ===== Anthropic Claude (DESATIVADO) =====
# # CLAUDE_API_KEY=sk-ant-SUA_CHAVE_REAL
# CLAUDE_API_KEY=





# ===== CONFIGURAÇÃO DO SERVIDOR =====
PORT=3000
NODE_ENV=development

# ===== AI PROVIDERS =====
AI_PROVIDER=nvidia

# ===== NVIDIA NIM =====
NVIDIA_API_KEY=UA_CHAVE_REAL
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_DEFAULT_MODEL=meta/llama-3.1-70b-instruct
NVIDIA_CHAT_MODELS=meta/llama-3.1-70b-instruct,nvidia/nemotron-3-super-120b-a12b,qwen/qwen3.5-122b-a10b,deepseek-ai/deepseek-v3.2

# ===== OUTROS PROVIDERS (vazios) =====
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
QWEN_API_KEY=
GEMINI_API_KEY=
CLAUDE_API_KEY=

# ===== CONFIGURAÇÕES DO CHATBOT =====
CHATBOT_NAME=MedAssistente
CHATBOT_MAX_TOKENS=2000
CHATBOT_TEMPERATURE=0.3








# ===== CONFIGURAÇÕES DO CHATBOT =====
#CHATBOT_PERSONALITY=Você é um assistente especializado em gestão hospitalar. Seja profissional, empático e preciso.


