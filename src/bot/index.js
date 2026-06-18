// Importa as funções principais do Baileys para conexão com o WhatsApp
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';

// Identificar o motivo da desconexão
import { Boom } from '@hapi/boom';

// Biblioteca para gerar o QR Code no terminal
import qrcode from 'qrcode-terminal';

// Logger utilizado pelo Baileys
import pino from 'pino';

// Manipulação de arquivos
import fs from 'fs';

// Função responsável por interpretar a mensagem do usuário
import { parsearMensagem } from './parser.js';

// Modelos do banco de dados
import { Transacao } from '../models/index.js';

// Funções que geram as mensagens de resposta do bot
import {
  respostaAjuda,
  respostaTransacaoSalva,
  respostaResumo,
  respostaListar,
  respostaMetaSalva,
  respostaApagado,
  respostaErro,
} from './respostas.js';

// Socket principal do WhatsApp
let sock = null;

// Indica se a sessão está pronta para receber mensagens
let sessaoPronta = false;

// ID do próprio bot
let botJid = '';

// ID do usuário autorizado a conversar com o bot
let userLid = '';

// Arquivo onde será salvo o ID do usuário autorizado
const CONFIG_FILE = './bot_config.json';


// Se existir um arquivo de configuração, tenta recuperar o usuário configurado
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
    userLid = config.userLid || '';
  } catch (e) {
    console.error('Erro ao ler config:', e);
  }
}


// Função auxiliar para pausar a execução por alguns milissegundos
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}


// Função principal responsável por conectar o bot ao WhatsApp
async function conectar() {

  // Carrega ou cria os arquivos de autenticação!!!
  const { state, saveCreds } = await useMultiFileAuthState('./auth_finbot');

  // Obtém a versão mais recente suportada do WhatsApp Web
  const { version } = await fetchLatestBaileysVersion();

  // Cria a conexão
  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['FinBot', 'Chrome', '1.0.0'],
  });


  // Evento responsável por monitorar mudanças na conexão
  sock.ev.on('connection.update', async (update) => {

    const { connection, lastDisconnect, qr } = update;

    // Caso seja necessário um novo login, gera o QR Code
    if (qr) {
      sessaoPronta = false;

      console.log('\n📱 Escaneie o QR Code abaixo:\n');

      qrcode.generate(qr, { small: true });
    }


    // Caso a conexão seja encerrada
    if (connection === 'close') {

      sessaoPronta = false;

      // Descobre o motivo da desconexão
      const motivo = new Boom(lastDisconnect?.error)?.output?.statusCode;

      // Verifica se deve reconectar automaticamente
      const deveReconectar = motivo !== DisconnectReason.loggedOut;

      if (deveReconectar) {

        console.log('🔄 Reconectando...');

        conectar();

      } else {

        console.log('❌ Desconectado. Apague auth_finbot e reinicie.');

      }
    }

    // Quando a conexão é estabelecida
    if (connection === 'open') {

      console.log('✅ Bot conectado!');

      // Salva o ID do próprio bot
      botJid = sock.user.id.split(':')[0];

      console.log(`Bot ID Base: ${botJid}`);

      // Verifica se já existe um usuário configurado
      if (userLid)
        console.log(`ID configurado: ${userLid}`);
      else
        console.log('⚠️ Aguardando comando "configurar".');

      // Espera alguns segundos antes de aceitar mensagens
      await sleep(5000);

      sessaoPronta = true;

      console.log('🟢 Bot pronto!');
    }
  });


  // Salva as credenciais sempre que forem atualizadas
  sock.ev.on('creds.update', saveCreds);


  // Evento disparado quando chegam novas mensagens
  sock.ev.on('messages.upsert', async ({ messages, type }) => {

    // Ignora mensagens que não sejam notificações
    if (type !== 'notify') return;

    // Percorre todas as mensagens recebidas
    for (const msg of messages) {

      try {

        const jid = msg.key.remoteJid;

        // Verifica se a mensagem foi enviada pelo próprio bot
        const fromMe = msg.key.fromMe;

        // Ignora mensagens de outras pessoas
        if (!fromMe) continue;

        // Ignora grupos
        if (jid.endsWith('@g.us')) continue;


        // Extrai o texto da mensagem
        const texto =
          (
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.ephemeralMessage?.message?.conversation ||
            msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
            ''
          ).trim();

        // Ignora mensagens vazias
        if (!texto) continue;


        
        // Se ainda não existir um usuário configurado ou
        // Se a mensagem for "configurar"
        
        if (!userLid || texto.toLowerCase() === 'configurar') {

          // Salva o chat atual como chat principal
          if (texto.toLowerCase() === 'configurar') {

            userLid = jid;

            fs.writeFileSync(
              CONFIG_FILE,
              JSON.stringify({ userLid })
            );

            console.log(`✅ Bot configurado para ${userLid}`);

            await enviar(
              jid,
              '✅ Bot configurado com sucesso!'
            );

            return;
          }

          if (!userLid) continue;
        }


        // Ignora mensagens vindas de outros chats
        if (jid !== userLid) continue;


        // Ignora mensagens de sistema
        if (msg.messageStubType) continue;


        // Evita processar mensagens enviadas pelo próprio bot
        const padroesDeResposta = [
          '👋',
          '🔴',
          '🟢',
          '📅',
          '📋',
          '🎯',
          '🗑️',
          '❌',
          '⚠️',
          '🚨'
        ];

        if (padroesDeResposta.some(p => texto.startsWith(p))) {
          continue;
        }


        // Interpreta a mensagem recebida
        const parsed = parsearMensagem(texto);


        // Caso seja uma transação financeira
        if (parsed.tipo === 'transacao') {

          // Salva no banco
          const transacao = await Transacao.create(parsed.dados);

          // Envia confirmação
          await enviar(jid, respostaTransacaoSalva(transacao));

          // Verifica se a meta foi atingida
          await verificarMeta(jid, transacao);
        }

        // Caso seja um comando
        else if (parsed.tipo === 'comando') {

          await processarComando(jid, parsed);

        }

        // Caso a mensagem seja inválida
        else {

          await enviar(jid, respostaErro());

        }

      } catch (err) {

        // Ignora erros de sessão
        if (
          err.message?.includes('No sessions') ||
          err.message?.includes('Bad MAC')
        ) return;

        console.error('Erro ao processar mensagem:', err);
      }
    }
  });
}

// Função responsável por enviar mensagens
async function enviar(jid, texto) {

  await sock.sendMessage(jid, {
    text: texto
  });

  console.log('✅ Mensagem enviada!');
}