import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { inicializarBanco } from './models/index.js';
import { conectar } from './bot/index.js';
import apiRoutes from './api/routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'online', versao: '1.0.0' });
});
app.use('/api', apiRoutes);

async function iniciar() {
  try {
    await inicializarBanco();
    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
      console.log(`📡 App Android deve apontar para esta URL`);
    });
    console.log('🤖 Iniciando bot WhatsApp...');
    await conectar();
  } catch (err) {
    console.error('❌ Erro ao iniciar:', err);
    process.exit(1);
  }
}

iniciar();