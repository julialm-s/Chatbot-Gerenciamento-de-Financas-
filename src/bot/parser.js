/**
 * Dicionário de categorias financeiras mapeado para palavras-chave.
 * Usado para classificar automaticamente transações com base na descrição.
 * A verificação é feita por inclusão de substring (case-insensitive).
 */
const CATEGORIAS = {
  alimentacao: [
    'mercado', 'supermercado', 'feira', 'açougue', 'padaria',
    'restaurante', 'lanche', 'pizza', 'comida', 'almoço',
    'jantar', 'café', 'ifood', 'rappi', 'uber eats'
  ],

  transporte: [
    'uber', 'taxi', 'ônibus', 'combustível', 'gasolina',
    'etanol', 'passagem', 'metro', 'estacionamento',
    '99', 'cabify'
  ],

  saude: [
    'farmácia', 'remédio', 'médico', 'consulta',
    'exame', 'hospital', 'dentista',
    'plano de saúde', 'academia'
  ],

  moradia: [
    'aluguel', 'condomínio', 'água', 'luz',
    'energia', 'internet', 'telefone',
    'gás', 'iptu', 'reforma'
  ],

  lazer: [
    'cinema', 'show', 'teatro', 'viagem',
    'hotel', 'passeio', 'streaming',
    'netflix', 'spotify', 'jogo'
  ],

  educacao: [
    'curso', 'faculdade', 'escola',
    'livro', 'material', 'mensalidade'
  ],

  roupas: [
    'roupa', 'sapato', 'tênis',
    'calça', 'camisa', 'vestido', 'loja'
  ],

  salario: [
    'salário', 'pagamento',
    'holerite', 'contracheque'
  ],

  freelance: [
    'freelance', 'freela',
    'trabalho extra', 'projeto',
    'consultoria', 'serviço'
  ],

  investimento: [
    'dividendo', 'rendimento',
    'juros', 'cdb', 'tesouro',
    'ação', 'fundo'
  ],

  // Categoria padrão caso nenhuma palavra-chave seja encontrada
  outros: [''],
};


// Lista de expressões usadas para reconhecer receitas e despesas em linguagem natural
 
const PADROES = [

  // Exemplo: "gastei 50 no mercado"
  {
    regex: /^(gastei|gasto|paguei|comprei|saiu)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)?\s+(?:no|na|em|com|de|pra|para|pelo|pela)?\s+(.+)$/i,
    tipo: 'gasto'
  },

  // Exemplo: "recebi 1000 salário"
  {
    regex: /^(recebi|ganhei|entrou|recebimento)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)?\s+(?:de|do|da|por|pelo|pela)?\s*(.+)$/i,
    tipo: 'receita'
  },

  // Exemplo: "50 mercado"
  {
    regex: /^(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s+(.+)$/i,
    tipo: 'gasto',
    curto: true
  },

  // Exemplo: "gastei 50"
  {
    regex: /^(gastei|gasto|paguei|comprei|saiu)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)?$/i,
    tipo: 'gasto',
    semDescricao: true
  },

  // Exemplo: "recebi 2000"
  {
    regex: /^(recebi|ganhei|entrou|recebimento)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|r\$)?$/i,
    tipo: 'receita',
    semDescricao: true
  },
];


// Expressões utilizadas para identificar comandos do bot
 
const COMANDOS = {

  // Exemplo: "resumo", "relatório", "saldo"
  resumo: /^(resumo|relatorio|relatório|balanço|saldo)(\s+do?\s+mes)?$/i,

  // Exemplo: "ajuda", "oi", "start"
  ajuda: /^(ajuda|help|\?|oi|olá|ola|start|iniciar)$/i,

  // Exemplo: "meta alimentação 500"
  meta: /^meta\s+(.+)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)$/i,

  // Exemplo: "listar 20"
  listar: /^(listar|lista|historico|histórico)(\s+\d+)?$/i,

  // Exemplo: "apagar 15"
  apagar: /^apagar\s+(\d+)$/i,
};


// Detecta automaticamente a categoria da transação com base nas palavras na descrição.
 
function detectarCategoria(descricao) {

  // Converte para minúsculas 
  const desc = descricao.toLowerCase();

  // Percorre todas as categorias
  for (const [categoria, palavras] of Object.entries(CATEGORIAS)) {

    // Verifica se alguma palavra-chave aparece na descrição
    if (palavras.some(p => desc.includes(p))) {

      return categoria;

    }
  }

  // Se nenhuma categoria for encontrada, retorna "outros"
  return 'outros';
}

// Converte uma string em número decimal.
function parsearValor(valorStr) {

  return parseFloat(valorStr.replace(',', '.'));

}


// Função principal responsável por interpretar
//as mensagens enviadas pelo usuário.
 
function parsearMensagem(texto) {

  // Remove espaços e converte para minúsculas
  const textoLimpo = texto.trim().toLowerCase();


  // Verifica comando de ajuda
  if (COMANDOS.ajuda.test(textoLimpo))
    return {
      tipo: 'comando',
      comando: 'ajuda'
    };


  // Verifica comando resumo
  if (COMANDOS.resumo.test(textoLimpo))
    return {
      tipo: 'comando',
      comando: 'resumo'
    };


  /*
   * Verifica comando listar.
   * Se não houver quantidade, assume 10 registros.
   */
  if (COMANDOS.listar.test(textoLimpo)) {

    const match = textoLimpo.match(COMANDOS.listar);

    const limite = match[2]
      ? parseInt(match[2].trim())
      : 10;

    return {
      tipo: 'comando',
      comando: 'listar',
      limite
    };
  }


  // Verifica comando de criação de meta.

  const metaMatch = textoLimpo.match(COMANDOS.meta);

  if (metaMatch) {

    return {
      tipo: 'comando',
      comando: 'meta',
      categoria: metaMatch[1].trim(),
      limite: parsearValor(metaMatch[2])
    };
  }


  // Verifica comando para apagar uma transação.
  
  const apagarMatch = textoLimpo.match(COMANDOS.apagar);

  if (apagarMatch) {

    return {
      tipo: 'comando',
      comando: 'apagar',
      id: parseInt(apagarMatch[1])
    };
  }


  // Tenta identificar se a mensagem representa uma receita ou despesa.
   
  for (const padrao of PADROES) {

    const match = texto.match(padrao.regex);

    if (match) {

      let valor;
      let descricao;


      // Formato curto
      // Exemplo: "30 uber"
      if (padrao.curto) {

        valor = parsearValor(match[1]);

        descricao = match[2].trim();

      }

      // Mensagem sem descrição
      // Exemplo: "gastei 20"
      else if (padrao.semDescricao) {

        valor = parsearValor(match[2]);

        descricao = 'outros';

      }

      // Formato completo
      else {

        valor = parsearValor(match[2]);

        descricao = match[3]
          ? match[3].trim()
          : 'outros';
      }


      // Detecta automaticamente a categoria
      const categoria = detectarCategoria(descricao);

      // Obtém data atual
      const agora = new Date();


      // Retorna os dados da transação
      return {

        tipo: 'transacao',

        dados: {

          tipo: padrao.tipo,              // receita ou gasto
          valor,                          // valor monetário
          descricao,                      // descrição da transação
          categoria,                      // categoria identificada
          mes: agora.getMonth() + 1,      // mês atual
          ano: agora.getFullYear(),       // ano atual
          mensagemOriginal: texto         // texto enviado pelo usuário

        },
      };
    }
  }


  // Caso nenhum padrão seja reconhecido
  return {
    tipo: 'desconhecido'
  };
}


// Exporta as funções para serem utilizadas em outros módulos.
 
export {
  parsearMensagem,
  detectarCategoria
};