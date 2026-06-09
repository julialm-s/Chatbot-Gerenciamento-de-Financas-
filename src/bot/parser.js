const CATEGORIAS = {
  alimentacao: ['mercado', 'supermercado', 'feira', 'açougue', 'padaria', 'restaurante', 'lanche', 'pizza', 'comida', 'almoço', 'jantar', 'café', 'ifood', 'rappi', 'uber eats'],
  transporte: ['uber', 'taxi', 'ônibus', 'combustível', 'gasolina', 'etanol', 'passagem', 'metro', 'estacionamento', '99', 'cabify'],
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

const COMANDOS = {
  resumo: /^(resumo|relatorio|relatório|balanço|saldo)(\s+do?\s+mes)?$/i,
  ajuda: /^(ajuda|help|\?|oi|olá|ola|start|iniciar)$/i,
  meta: /^meta\s+(.+)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)$/i,
  listar: /^(listar|lista|historico|histórico)(\s+\d+)?$/i,
  apagar: /^apagar\s+(\d+)$/i,
};