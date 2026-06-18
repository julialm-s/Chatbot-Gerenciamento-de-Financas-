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

let sock = null;
let sessaoPronta = false;
let botJid = ''; 
let userLid = ''; 

const CONFIG_FILE = './bot_config.json';

if (fs.existsSync(CONFIG_FILE)) {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
        userLid = config.userLid || '';
    } catch (e) {
        console.error('Erro ao ler config:', e);
    }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function conectar() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_finbot');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['FinBot', 'Chrome', '1.0.0'],
  });


    sock.ev.on('connection.update', async (update) => {

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      sessaoPronta = false;
      console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      sessaoPronta = false;
      const motivo = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const deveReconectar = motivo !== DisconnectReason.loggedOut;
      if (deveReconectar) {
        console.log('🔄 Reconectando...');
        conectar();
      } else {
        console.log('❌ Desconectado. Apague a pasta auth_finbot e reinicie.');
      }
    }

    if (connection === 'open') {
      console.log('✅ Bot WhatsApp conectado!');
      botJid = sock.user.id.split(':')[0];
      console.log(`Bot ID Base: ${botJid}`);
      if (userLid) console.log(`ID do Usuário Configurado: ${userLid}`);
      else console.log('⚠️ Aguardando comando "configurar" no chat privado...');
      
      await sleep(5000);
      sessaoPronta = true;
      console.log('🟢 Bot pronto!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        const jid = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!fromMe) continue;

        if (jid.endsWith('@g.us')) continue;

        const texto = (msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.ephemeralMessage?.message?.conversation
          || msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text
          || '').trim();

        if (!texto) continue;

        if (!userLid || texto.toLowerCase() === 'configurar') {
            if (texto.toLowerCase() === 'configurar') {
                userLid = jid;
                fs.writeFileSync(CONFIG_FILE, JSON.stringify({ userLid }));
                console.log(`✅ Bot configurado para o ID: ${userLid}`);
                await enviar(jid, '✅ Bot configurado com sucesso! Agora responderei apenas neste chat.');
                return; 
            }
          
            if (!userLid) continue;
        }

        if (jid !== userLid) continue;

        if (msg.messageStubType) continue; 

        const padroesDeResposta = ['👋', '🔴', '🟢', '📅', '📋', '🎯', '🗑️', '❌', '⚠️', '🚨'];
        if (padroesDeResposta.some(p => texto.startsWith(p))) {
            continue;
        }
        
        const parsed = parsearMensagem(texto);

        if (parsed.tipo === 'transacao') {
          const transacao = await Transacao.create(parsed.dados);
          await enviar(jid, respostaTransacaoSalva(transacao));
          await verificarMeta(jid, transacao);
        } else if (parsed.tipo === 'comando') {
          await processarComando(jid, parsed);
        } else {
          await enviar(jid, respostaErro());
        }

      } catch (err) {
        if (err.message?.includes('No sessions') || err.message?.includes('Bad MAC')) return;
        console.error('Erro ao processar mensagem:', err);
      }
    }
  });
}

async function enviar(jid, texto) {
  await sock.sendMessage(jid, { text: texto });
  console.log(`✅ Mensagem enviada!`);
}

async function processarComando(jid, parsed) {
  const agora = new Date();
  const mes = agora.getMonth() + 1;
  const ano = agora.getFullYear();

  switch (parsed.comando) {
    case 'ajuda':
      await enviar(jid, respostaAjuda());
      break;

    case 'resumo': {
      const gastos = await Transacao.findAll({ where: { tipo: 'gasto', mes, ano } });
      const receitas = await Transacao.findAll({ where: { tipo: 'receita', mes, ano } });
      const totalGastos = gastos.reduce((s, t) => s + t.valor, 0);
      const totalReceitas = receitas.reduce((s, t) => s + t.valor, 0);
      const porCategoriaMap = {};
      gastos.forEach(t => { porCategoriaMap[t.categoria] = (porCategoriaMap[t.categoria] || 0) + t.valor; });
      const porCategoria = Object.entries(porCategoriaMap)
        .map(([categoria, total]) => ({ categoria, total }))
        .sort((a, b) => b.total - a.total);
      await enviar(jid, respostaResumo({ totalGastos, totalReceitas, saldo: totalReceitas - totalGastos, porCategoria, mes, ano }));
      break;
    }

    case 'listar': {
      const transacoes = await Transacao.findAll({ order: [['createdAt', 'DESC']], limit: parsed.limite || 10 });
      await enviar(jid, respostaListar(transacoes));
      break;
    }

    case 'meta':
      await Meta.upsert({ categoria: parsed.categoria, limite: parsed.limite, mes, ano });
      await enviar(jid, respostaMetaSalva(parsed.categoria, parsed.limite));
      break;

    case 'apagar': {
      const t = await Transacao.findByPk(parsed.id);
      if (t) {
        await t.destroy();
        await enviar(jid, respostaApagado(parsed.id));
      } else {
        await enviar(jid, `❌ Transação #${parsed.id} não encontrada.`);
      }
      break;
    }
  }
}

async function verificarMeta(jid, transacao) {
  if (transacao.tipo !== 'gasto') return;
  const agora = new Date();
  const mes = agora.getMonth() + 1;
  const ano = agora.getFullYear();
  const meta = await Meta.findOne({ where: { categoria: transacao.categoria, mes, ano } });
  if (!meta) return;
  const gastosCat = await Transacao.findAll({ where: { tipo: 'gasto', categoria: transacao.categoria, mes, ano } });
  const totalGasto = gastosCat.reduce((s, t) => s + t.valor, 0);
  const percentual = (totalGasto / meta.limite) * 100;
  if (percentual >= 100) {
    await enviar(jid, `🚨 *Atenção!* Você ultrapassou a meta de *${transacao.categoria}*!\nGasto: R$ ${totalGasto.toFixed(2)} / Limite: R$ ${meta.limite.toFixed(2)}`);
  } else if (percentual >= 80) {
    await enviar(jid, `⚠️ Você já usou *${percentual.toFixed(0)}%* da meta de *${transacao.categoria}* (R$ ${totalGasto.toFixed(2)} de R$ ${meta.limite.toFixed(2)})`);
  }
}

export { conectar };


