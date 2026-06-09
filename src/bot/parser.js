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

function parsearMensagem(texto) {
  // 1. Pré-processamento da mensagem:
  // Remove espaços em branco do início e fim e converte para minúsculas para padronização
  // e facilita a comparação com as expressões regulares.
  const textoLimpo = texto.trim().toLowerCase();

  // 2. Verificação de Comandos:
  // Tenta identificar comandos predefinidos usando expressões regulares (COMANDOS).

  // 2.1. Comando 'ajuda':
  // Verifica se o texto corresponde ao padrão do comando 'ajuda'.
  if (COMANDOS.ajuda.test(textoLimpo)) {
    return { tipo: 'comando', comando: 'ajuda' };
  }
  // 2.2. Comando 'resumo':
  // Verifica se o texto corresponde ao padrão do comando 'resumo'.
  if (COMANDOS.resumo.test(textoLimpo)) {
    return { tipo: 'comando', comando: 'resumo' };
  }

  // 2.3. Comando 'listar':
  // Verifica se o texto corresponde ao padrão do comando 'listar'.
  if (COMANDOS.listar.test(textoLimpo)) {
    const match = textoLimpo.match(COMANDOS.listar);
    // Extrai o limite, se presente (segundo grupo de captura da regex), caso contrário, define 10 como padrão.
    const limite = match[2] ? parseInt(match[2].trim()) : 10;
    return { tipo: 'comando', comando: 'listar', limite };
  }

  // 2.4. Comando 'meta':
  // Tenta encontrar o padrão para o comando 'meta'.
  const metaMatch = textoLimpo.match(COMANDOS.meta);
  if (metaMatch) {
    // Extrai a categoria (primeiro grupo de captura) e o valor (segundo grupo de captura).
    return { tipo: 'comando', comando: 'meta', categoria: metaMatch[1].trim(), limite: parsearValor(metaMatch[2]) };
  }

  // 2.5. Comando 'apagar':
  // Tenta encontrar o padrão para o comando 'apagar'.
  const apagarMatch = textoLimpo.match(COMANDOS.apagar);
  if (apagarMatch) {
    // Extrai o ID (primeiro grupo de captura) e converte para inteiro.
    return { tipo: 'comando', comando: 'apagar', id: parseInt(apagarMatch[1]) };
  }

  // 3. Verificação de Transações:
  // Se não for um comando, itera sobre os padrões de transação predefinidos (PADROES).
  for (const padrao of PADROES) {
    // Tenta encontrar um padrão de transação na mensagem original (não no textoLimpo, pois a descrição pode ter maiúsculas).
    const match = texto.match(padrao.regex);
    if (match) {
      let valor, descricao;

      // Lógica para extrair valor e descrição com base no tipo de padrão (curto, semDescricao ou padrão completo).
      if (padrao.curto) {
        valor = parsearValor(match[1]); // Valor no primeiro grupo de captura.
        descricao = match[2].trim();    // Descrição no segundo grupo de captura.
      } else if (padrao.semDescricao) {
        valor = parsearValor(match[2]); // Valor no segundo grupo de captura.
        descricao = 'outros';           // Descrição padrão 'outros'.
      } else {
        valor = parsearValor(match[2]); // Valor no segundo grupo de captura.
        descricao = match[3] ? match[3].trim() : 'outros'; // Descrição no terceiro grupo ou 'outros'.
      }

      // Detecta a categoria da transação com base na descrição.
      const categoria = detectarCategoria(descricao);
      // Obtém a data e hora atual para registrar o mês e ano da transação.
      const agora = new Date();

      // Retorna um objeto representando a transação encontrada.
      return {
        tipo: 'transacao',
        dados: {
          tipo: padrao.tipo, // Tipo de transação (ex: 'despesa', 'receita').
          valor,
          descricao,
          categoria,
          mes: agora.getMonth() + 1, // Mês (0-11, então adiciona 1).
          ano: agora.getFullYear(),
          mensagemOriginal: texto, // Mantém a mensagem original para referência.
        },
      };
    }
  }

  // 4. Mensagem Desconhecida:
  // Se nenhum comando ou padrão de transação for correspondido, a mensagem é desconhecida.
  return { tipo: 'desconhecido' };
}

/**
 * Exporta a função `parsearMensagem` e `detectarCategoria` para serem utilizadas em outros módulos.
 * A função `detectarCategoria` não foi fornecida no snippet, mas é referenciada.
 */
export { parsearMensagem, detectarCategoria };