
// parser.js - Responsável por interpretar as mensagens do usuário e extrair informações relevantes

const CATEGORIAS = {
  alimentação: ['mercado', 'supermercado', 'feira', 'açougue', 'padaria', 'restaurante', 'lanche', 'pizza', 'comida', 'almoço', 'jantar', 'café', 'ifood', 'rappi', 'uber eats'],
  transporte: ['uber', 'taxi', 'ônibus', 'combustível', 'gasolina', 'etanol', 'passagem', 'metro', 'estacionamento', '99', 'cabify'],
  saúde: ['farmácia', 'remédio', 'médico', 'consulta', 'exame', 'hospital', 'dentista', 'plano de saúde', 'academia'],
  moradia: ['aluguel', 'condomínio', 'água', 'luz', 'energia', 'internet', 'telefone', 'gás', 'iptu', 'reforma'],
  lazer: ['cinema', 'show', 'teatro', 'viagem', 'hotel', 'passeio', 'streaming', 'netflix', 'spotify', 'jogo'],
  educação: ['curso', 'faculdade', 'escola', 'livro', 'material', 'mensalidade'],
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

const COMANDOS = {
  resumo: /^(resumo|relatorio|relatório|balanço|saldo)(\s+do?\s+mes)?$/i,
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

function parsearMensagem(texto) {
  const textoLimpo = texto.trim().toLowerCase();

  if (COMANDOS.ajuda.test(textoLimpo)) return { tipo: 'comando', comando: 'ajuda' };
  if (COMANDOS.resumo.test(textoLimpo)) return { tipo: 'comando', comando: 'resumo' };

  if (COMANDOS.listar.test(textoLimpo)) {
    const match = textoLimpo.match(COMANDOS.listar);
    const limite = match[2] ? parseInt(match[2].trim()) : 10;
    return { tipo: 'comando', comando: 'listar', limite };
  }

  const metaMatch = textoLimpo.match(COMANDOS.meta);
  if (metaMatch) {
    return { tipo: 'comando', comando: 'meta', categoria: metaMatch[1].trim(), limite: parsearValor(metaMatch[2]) };
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

export { parsearMensagem, detectarCategoria };