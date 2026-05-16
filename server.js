// server.js
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.js';

// ===== CARREGAR VARIÁVEIS DE AMBIENTE =====
dotenv.config();

// ===== DEBUG: Verificar se .env foi lido corretamente =====
console.log('\n🔐 DEBUG: Variáveis de Ambiente');
console.log('   PORT:', process.env.PORT || '3000 (default)');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development (default)');
console.log('   NVIDIA_API_KEY:', process.env.NVIDIA_API_KEY ? `✅ Definida (${process.env.NVIDIA_API_KEY.substring(0, 10)}...)` : '❌ Não definida');
console.log('   NVIDIA_API_KEY length:', process.env.NVIDIA_API_KEY?.length);
console.log('   NVIDIA_CHAT_MODELS:', process.env.NVIDIA_CHAT_MODELS || '(não definido)');
console.log('   AI_PROVIDER:', process.env.AI_PROVIDER || 'demo (default)');
console.log('');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====
app.use(helmet({
  contentSecurityPolicy: false // Permitir scripts inline para desenvolvimento
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seu-dominio.com'] 
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});

// ===== ARQUIVOS ESTÁTICOS =====
app.use(express.static(join(__dirname, 'public')));

// ===== ROTAS =====
app.use('/api', apiLimiter, apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedGestão Pro API',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.AI_PROVIDER || 'demo',
    nvidiaEnabled: !!process.env.NVIDIA_API_KEY?.trim()?.startsWith('nvapi-'),
    uptime: process.uptime()
  });
});

// Rota principal - serve o frontend
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ===== TRATAMENTO DE ERROS GLOBAL =====
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====
app.listen(PORT, () => {
  const nvidiaStatus = process.env.NVIDIA_API_KEY?.trim()?.startsWith('nvapi-') ? '✅ NVIDIA' : '⚠️ Demo';
  
  console.log(`
╔═════════════════════════════════════════════════════════╗
║                                                         ║
║   🏥  MedGestão Pro - Sistema Hospitalar AI             ║
║                                                         ║
║   🌐 Servidor: http://localhost:${PORT}                    ║
║   🤖 AI: ${nvidiaStatus}                                          ║
║   📦 Ambiente: ${process.env.NODE_ENV || 'development'}                    ║
║   ⏱️  Uptime: 0s                                        ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
  `);
});

export default app;