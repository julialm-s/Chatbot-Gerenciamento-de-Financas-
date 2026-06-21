// respostas.js - Responsável por formatar as respostas que o bot envia para o usuário

const EMOJIS_CATEGORIA = {
  alimentação: '🍽️',
  transporte: '🚗',
  saúde: '💊',
  moradia: '🏠',
  lazer: '🎮',
  educação: '📚',
  roupas: '👕',
  salario: '💼',
  freelance: '💻',
  investimento: '📈',
  outros: '📦',
};

function formatarMoeda(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function emojiCategoria(cat) {
  return EMOJIS_CATEGORIA[cat] || '📦';
}

function respostaAjuda() {
  return `👋 *Olá! Sou seu assistente financeiro!*

📝 *Como registrar gastos:*
• _Gastei 50 no mercado_
• _Paguei 30 uber_
• _Comprei 100 roupa_

📝 *Como registrar receitas:*
• _Recebi 3000 salário_
• _Entrou 500 freelance_

📊 *Comandos disponíveis:*
• *resumo* — ver balanço do mês
• *listar* — ver últimas transações
• *listar 20* — ver as últimas 20
• *meta alimentacao 500* — definir limite
• *apagar 5* — apagar transação #5
• *ajuda* — ver esta mensagem`;
}

function respostaTransacaoSalva(transacao) {
  const emoji = transacao.tipo === 'gasto' ? '🔴' : '🟢';
  const tipoTexto = transacao.tipo === 'gasto' ? 'Gasto' : 'Receita';
  return `${emoji} *${tipoTexto} registrado!*
━━━━━━━━━━━━━
📌 #${transacao.id} | ${emojiCategoria(transacao.categoria)} ${transacao.categoria}
📝 ${transacao.descricao}
💵 Valor: *${formatarMoeda(transacao.valor)}*
━━━━━━━━━━━━━
_Para apagar: *apagar ${transacao.id}*_`;
}

function respostaResumo({ totalGastos, totalReceitas, saldo, porCategoria, mes, ano }) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const nomeMes = meses[mes - 1];
  const saldoEmoji = saldo >= 0 ? '📈' : '📉';
  const saldoSinal = saldo >= 0 ? '+' : '';

  let categoriaTexto = '';
  if (porCategoria && porCategoria.length > 0) {
    categoriaTexto = '\n📊 *Gastos por categoria:*\n';
    porCategoria.forEach(({ categoria, total }) => {
      const emoji = emojiCategoria(categoria);
      categoriaTexto += `${emoji} ${categoria}: *${formatarMoeda(total)}*\n`;
    });
  }

  return `📅 *Resumo de ${nomeMes}/${ano}*
━━━━━━━━━━━━━━
🟢 Receitas: *${formatarMoeda(totalReceitas)}*
🔴 Gastos: *${formatarMoeda(totalGastos)}*
${saldoEmoji} Saldo: *${saldoSinal}${formatarMoeda(saldo)}*
━━━━━━━━━━━━━━${categoriaTexto}
_Use o app para ver gráficos detalhados_ 📱`;
}

function respostaListar(transacoes) {
  if (transacoes.length === 0) {
    return '📝 Nenhuma transação registrada ainda.\n\nComece mandando: _Gastei 50 no mercado_';
  }

  let texto = `📋 *Últimas ${transacoes.length} transações:*\n━━━━━━━━━━━━━━\n`;
  transacoes.forEach(t => {
    const emoji = t.tipo === 'gasto' ? '🔴' : '🟢';
    texto += `${emoji} #${t.id} | ${formatarMoeda(t.valor)} — ${t.descricao} _(${t.data})_\n`;
  });
  texto += `━━━━━━━━━━━━━━\n_Para apagar: *apagar ID*_`;
  return texto;
}

function respostaMetaSalva(categoria, limite) {
  return `🎯 *Meta definida!*\n${emojiCategoria(categoria)} ${categoria}: limite de *${formatarMoeda(limite)}*\n\n_Você será avisado quando atingir 80% do limite._`;
}

function respostaApagado(id) {
  return `🗑️ Transação #${id} apagada com sucesso!`;
}

function respostaErro() {
  return `❌ Não entendi sua mensagem.\n\nExemplos válidos:\n• _Gastei 50 no mercado_\n• _Recebi 3000 salário_\n• Digite *ajuda* para ver todos os comandos.`;
}

export {
  respostaAjuda,
  respostaTransacaoSalva,
  respostaResumo,
  respostaListar,
  respostaMetaSalva,
  respostaApagado,
  respostaErro,
};