import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/api.js';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seu-dominio.com'] 
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
    aiProvider: process.env.AI_PROVIDER || 'openai',
    uptime: process.uptime()
  });
});

// Rota principal
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ===== TRATAMENTO DE ERROS =====
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ===== INICIALIZAÇÃO =====
app.listen(PORT, () => {
  console.log(`
╔═════════════════════════════════════════════════════════╗                                          
║                                                         ║
║   🏥  MedGestão Pro - Sistema Hospitalar AI             ║
║                                                         ║
║   🌐 Servidor: http://localhost:${PORT}                 ║
║   🤖 AI Provider: ${process.env.AI_PROVIDER || 'openai'} ║                    
║   📦 Ambiente: ${process.env.NODE_ENV || 'development'}   ║                     
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;