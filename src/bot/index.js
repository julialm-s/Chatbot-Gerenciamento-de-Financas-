//utiliza a biblioteca @whiskeysockets/baileys para integração com o WhatsApp,
// gerencia a autenticação, processa mensagens recebidas e interage com um banco de dados de transações.

import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs'; 
import { parsearMensagem } from './parser.js';
import { Transacao, Meta } from '../models/index.js';
import {
  respostaAjuda,
  respostaTransacaoSalva,
  respostaResumo,
  respostaListar,
  respostaMetaSalva,
  respostaApagado,
  respostaErro,
} from './respostas.js';

// --- Variáveis de Estado Globais ---
let sock = null;          // Instância da conexão do WhatsApp
let sessaoPronta = false; // Flag para indicar se o bot está pronto para operar
let botJid = '';          // ID do bot no WhatsApp
let userLid = '';         // ID do usuário autorizado (LID)

const CONFIG_FILE = './bot_config.json';

// --- Inicialização de Configuração ---
// Tenta carregar o ID do usuário autorizado de um arquivo de configuração local.
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
        userLid = config.userLid || '';
    } catch (e) {
        console.error('Erro ao ler config:', e);
    }
}

/**
 * Função utilitária para pausar a execução por um determinado tempo.
 * @param {number} ms Milissegundos para aguardar.
 */
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Função principal para estabelecer e gerenciar a conexão com o WhatsApp.
 */
async function conectar() {
  // Configura a autenticação persistente em arquivos locais na pasta './auth_finbot'.
  const { state, saveCreds } = await useMultiFileAuthState('./auth_finbot');
  // Busca a versão mais recente do protocolo do WhatsApp suportada pela biblioteca.
  const { version } = await fetchLatestBaileysVersion();

  // Inicializa o socket do WhatsApp com as configurações desejadas.
  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }), // Silencia logs detalhados para manter o console limpo
    printQRInTerminal: false,          // Desabilita a impressão automática do QR Code (será feito manualmente)
    browser: ['FinançasBot', 'Chrome', '1.0.0'], // Identificação do bot nas sessões do WhatsApp
  });

  // Falta gerenciamento de Eventos de Conexão ---
  