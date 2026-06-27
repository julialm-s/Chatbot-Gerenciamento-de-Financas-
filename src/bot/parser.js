
// parser.js - Responsável por interpretar as mensagens do usuário e extrair informações relevantes

const CATEGORIAS = {
  alimentacao: ['mercado', 'supermercado', 'feira', 'açougue', 'padaria', 'restaurante', 'lanche', 'pizza', 'comida', 'almoço', 'jantar', 'café', 'ifood', 'rappi', 'uber eats'],
  transporte: ['uber', 'taxi', 'ônibus', 'combustível', 'gasolina', 'etanol', 'passagem', 'metro', 'estacionamento', '99', 'cabify', 'transporte', 'mototaxi'],
  saude: ['farmácia', 'remédio', 'médico', 'consulta', 'exame', 'hospital', 'dentista', 'plano de saúde', 'academia'],
  moradia: ['aluguel', 'condomínio', 'água', 'luz', 'energia', 'internet', 'telefone', 'gás', 'iptu', 'reforma'],
  lazer: ['cinema', 'show', 'teatro', 'viagem', 'hotel', 'passeio', 'streaming', 'netflix', 'spotify', 'jogo'],
  educacao: ['curso', 'faculdade', 'escola', 'livro', 'material', 'mensalidade'],
  roupas: ['roupa', 'sapato', 'tênis', 'calça', 'camisa', 'vestido', 'loja'],
  salario: ['salário', 'pagamento', 'holerite', 'contracheque'],
  freelance: ['freelance', 'freela', 'trabalho extra', 'projeto', 'consultoria', 'serviço'],
  investimento: ['dividendo', 'rendimento', 'juros', 'cdb', 'tesouro', 'ação', 'fundo'],
  outros: [''],
};

const PADROES = [
  { regex: /^(gastei|gasto|paguei|comprei|saiu)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)?\s+(?:no|na|em|com|de|pra|para|pelo|pela)?\s+(.+)$/i, tipo: 'gasto' },
  { regex: /^(recebi|ganhei|entrou|recebimento)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)?\s+(?:de|do|da|por|pelo|pela)?\s*(.+)$/i, tipo: 'receita' },
  { regex: /^(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(.+)$/i, tipo: 'gasto', curto: true },
  { regex: /^(gastei|gasto|paguei|comprei|saiu)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)?$/i, tipo: 'gasto', semDescricao: true },
  { regex: /^(recebi|ganhei|entrou|recebimento)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)?$/i, tipo: 'receita', semDescricao: true },
];

const MESES_NOMES = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const COMANDOS = {
  resumo: /^resumo(?:\s+(.+))?$/i,
  ajuda: /^(ajuda|help|\?|oi|olá|ola|start|iniciar)$/i,
  meta: /^meta\s+(.+)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)$/i,
  listar: /^(listar|lista|historico|histórico)(\s+\d+)?$/i,
  apagar: /^apagar\s+(\d+)$/i,
};

function detectarCategoria(descricao) {
  const desc = descricao.toLowerCase();
  for (const [categoria, palavras] of Object.entries(CATEGORIAS)) {
    if (palavras.some(p => desc.includes(p))) {
      return categoria;
    }
  }
  return 'outros';
}

function parsearValor(valorStr) {
  return parseFloat(valorStr.replace(',', '.'));
}

function parsearPeriodoResumo(parametro) {
  if (!parametro) {
    // Sem parâmetro: mês atual
    const agora = new Date();
    return { tipo: 'mes', mes: agora.getMonth() + 1, ano: agora.getFullYear() };
  }

  const p = parametro.trim().toLowerCase();

  // "semana" → últimos 7 dias
  if (p === 'semana') {
    return { tipo: 'dias', dias: 7 };
  }

  // "mes passado" ou "mês passado"
  if (p === 'mes passado' || p === 'mês passado') {
    const agora = new Date();
    const d = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    return { tipo: 'mes', mes: d.getMonth() + 1, ano: d.getFullYear() };
  }

  // "ano"
  if (p === 'ano') {
    return { tipo: 'ano', ano: new Date().getFullYear() };
  }

  // "ultimos X dias" ou "últimos X dias"
  const ultimosDias = p.match(/^[uú]ltimos?\s+(\d+)\s+dias?$/i);
  if (ultimosDias) {
    return { tipo: 'dias', dias: parseInt(ultimosDias[1]) };
  }

  // Nome do mês (ex: "maio", "junho")
  if (MESES_NOMES[p]) {
    const agora = new Date();
    return { tipo: 'mes', mes: MESES_NOMES[p], ano: agora.getFullYear() };
  }

  return null; // período não reconhecido
}

function parsearMensagem(texto) {
  const textoLimpo = texto.trim().toLowerCase();

  if (COMANDOS.ajuda.test(textoLimpo)) return { tipo: 'comando', comando: 'ajuda' };

  // Resumo com período flexível
  const resumoMatch = textoLimpo.match(COMANDOS.resumo);
  if (resumoMatch) {
    const periodo = parsearPeriodoResumo(resumoMatch[1]);
    if (resumoMatch[1] && !periodo) {
      return { tipo: 'desconhecido' }; // tinha parâmetro mas não foi reconhecido
    }
    return { tipo: 'comando', comando: 'resumo', periodo };
  }

  if (COMANDOS.listar.test(textoLimpo)) {
    const match = textoLimpo.match(COMANDOS.listar);
    const limite = match[2] ? parseInt(match[2].trim()) : 10;
    return { tipo: 'comando', comando: 'listar', limite };
  }

  const metaMatch = textoLimpo.match(COMANDOS.meta);
  if (metaMatch) {
    const categoriaNormalizada = metaMatch[1].trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return { tipo: 'comando', comando: 'meta', categoria: categoriaNormalizada, limite: parsearValor(metaMatch[2]) };
  }

  const apagarMatch = textoLimpo.match(COMANDOS.apagar);
  if (apagarMatch) {
    return { tipo: 'comando', comando: 'apagar', id: parseInt(apagarMatch[1]) };
  }

  for (const padrao of PADROES) {
    const match = texto.match(padrao.regex);
    if (match) {
      let valor, descricao;

      if (padrao.curto) {
        valor = parsearValor(match[1]);
        descricao = match[2].trim();
      } else if (padrao.semDescricao) {
        valor = parsearValor(match[2]);
        descricao = 'outros';
      } else {
        valor = parsearValor(match[2]);
        descricao = match[3] ? match[3].trim() : 'outros';
      }

      const categoria = detectarCategoria(descricao);
      const agora = new Date();

      return {
        tipo: 'transacao',
        dados: {
          tipo: padrao.tipo,
          valor,
          descricao,
          categoria,
          mes: agora.getMonth() + 1,
          ano: agora.getFullYear(),
          mensagemOriginal: texto,
        },
      };
    }
  }

  return { tipo: 'desconhecido' };
}

export { parsearMensagem, detectarCategoria, parsearPeriodoResumo };