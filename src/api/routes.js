import express from 'express';
import { Transacao} from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Middleware de Autenticação
router.use((req, res, next) => {
  const chave = req.headers['x-api-key'];
  if (chave !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ erro: 'Não autorizado. Informe x-api-key no header.' });
  }
  next();
});

// GET /api/transacoes
router.get('/transacoes', async (req, res) => {
  try {
    const { mes, ano, tipo, categoria, limite = 50, pagina = 1 } = req.query;
    const where = {};
    if (mes) where.mes = parseInt(mes);
    if (ano) where.ano = parseInt(ano);
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;

    const transacoes = await Transacao.findAndCountAll({
      where,
      order: [['data', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limite),
      offset: (parseInt(pagina) - 1) * parseInt(limite),
    });

    res.json({ total: transacoes.count, pagina: parseInt(pagina), dados: transacoes.rows });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/transacoes
router.post('/transacoes', async (req, res) => {
  try {
    const { tipo, valor, descricao, categoria, data } = req.body;
    const dataReal = data ? new Date(data) : new Date();

    const transacao = await Transacao.create({
      tipo,
      valor: parseFloat(valor),
      descricao,
      categoria: categoria || 'outros',
      data: dataReal.toISOString().split('T')[0],
      mes: dataReal.getMonth() + 1,
      ano: dataReal.getFullYear(),
      mensagemOriginal: 'App',
    });

    res.status(201).json(transacao);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/transacoes/:id
router.delete('/transacoes/:id', async (req, res) => {
  try {
    const t = await Transacao.findByPk(req.params.id);
    if (!t) return res.status(404).json({ erro: 'Transação não encontrada' });
    await t.destroy();
    res.json({ mensagem: 'Transação apagada com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/resumo
router.get('/resumo', async (req, res) => {
  try {
    const agora = new Date();
    const mes = parseInt(req.query.mes) || agora.getMonth() + 1;
    const ano = parseInt(req.query.ano) || agora.getFullYear();

    const transacoes = await Transacao.findAll({ where: { mes, ano } });
    const gastos = transacoes.filter(t => t.tipo === 'gasto');
    const receitas = transacoes.filter(t => t.tipo === 'receita');
    const totalGastos = gastos.reduce((s, t) => s + t.valor, 0);
    const totalReceitas = receitas.reduce((s, t) => s + t.valor, 0);

    const porCategoria = {};
    gastos.forEach(t => { porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor; });

    const receitasPorCategoria = {};
    receitas.forEach(t => { receitasPorCategoria[t.categoria] = (receitasPorCategoria[t.categoria] || 0) + t.valor; });

    res.json({ mes, ano, totalGastos, totalReceitas, saldo: totalReceitas - totalGastos, gastosCount: gastos.length, receitasCount: receitas.length, porCategoria, receitasPorCategoria });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/evolucao
router.get('/evolucao', async (req, res) => {
  try {
    const meses = parseInt(req.query.meses) || 6;
    const agora = new Date();
    const resultado = [];

    for (let i = meses - 1; i >= 0; i--) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();
      const transacoes = await Transacao.findAll({ where: { mes, ano } });
      const totalGastos = transacoes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.valor, 0);
      const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
      resultado.push({ mes, ano, totalGastos, totalReceitas, saldo: totalReceitas - totalGastos });
    }

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/metas
router.get('/metas', async (req, res) => {
  try {
    const agora = new Date();
    const mes = parseInt(req.query.mes) || agora.getMonth() + 1;
    const ano = parseInt(req.query.ano) || agora.getFullYear();

    const metas = await Meta.findAll({ where: { mes, ano } });
    const metasComProgresso = await Promise.all(metas.map(async (meta) => {
      const gastos = await Transacao.findAll({ where: { tipo: 'gasto', categoria: meta.categoria, mes, ano } });
      const gastoAtual = gastos.reduce((s, t) => s + t.valor, 0);
      return { ...meta.toJSON(), gastoAtual, percentual: (gastoAtual / meta.limite) * 100 };
    }));

    res.json(metasComProgresso);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/metas
router.post('/metas', async (req, res) => {
  try {
    const { categoria, limite, mes, ano } = req.body;
    const agora = new Date();
    const meta = await Meta.upsert({
      categoria,
      limite: parseFloat(limite),
      mes: mes || agora.getMonth() + 1,
      ano: ano || agora.getFullYear(),
    });
    res.status(201).json(meta);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;