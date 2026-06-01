// Importa os módulos principais do Sequelize (ORM para Node.js) e os tipos de dados suportados
import { Sequelize, DataTypes } from 'sequelize';
// Carrega as variáveis de ambiente definidas no arquivo .env
import 'dotenv/config';

// Cria uma instância do Sequelize configurada para conectar a um banco SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',                  // Define o tipo de banco
  storage: process.env.DB_PATH || './finbot.db', // Caminho do arquivo do banco. Usa variável de ambiente se existir, senão cria 'finbot.db' na raiz
  logging: false,                     // Desativa a exibição das queries SQL no console 
});

// Define o modelo 'Transacao', que mapeia a tabela de transações financeiras
const Transacao = sequelize.define('Transacao', {
  id: {
    type: DataTypes.INTEGER,          // Tipo numérico inteiro
    primaryKey: true,                 // Define como chave primária da tabela
    autoIncrement: true,              // Gera automaticamente um novo ID sequencial a cada inserção
  },
  tipo: {
    type: DataTypes.ENUM('gasto', 'receita'), // Campo restrito a apenas dois valores possíveis
    allowNull: false,                 // Torna o campo obrigatório
  },
  valor: {
    type: DataTypes.FLOAT,            // Número decimal para valores monetários
    allowNull: false,                 // Campo obrigatório
  },
  descricao: {
    type: DataTypes.STRING,           // Texto curto para descrever a transação
    allowNull: false,                 // Campo obrigatório
  },
  categoria: {
    type: DataTypes.STRING,           // Texto para classificar a transação (ex: 'alimentação', 'lazer')
    defaultValue: 'outros',           // Se não for informado, assume 'outros' como padrão
  },
  data: {
    type: DataTypes.DATEONLY,         // Armazena apenas a data no formato YYYY-MM-DD 
    defaultValue: DataTypes.NOW,      // Preenche automaticamente com a data atual se não fornecido
  },
  mes: {
    type: DataTypes.INTEGER,          // Mês extraído da data (útil para filtros e relatórios mensais)
  },
  ano: {
    type: DataTypes.INTEGER,          // Ano extraído da data (útil para filtros e relatórios anuais)
  },
  mensagemOriginal: {
    type: DataTypes.STRING,           // Armazena o texto bruto enviado pelo usuário 
  },
}, {
  tableName: 'transacoes',            // Nome explícito da tabela no banco 
  timestamps: true,                   // Cria automaticamente as colunas 'createdAt' e 'updatedAt' para auditoria
});

// Define o modelo 'Meta', que armazena limites orçamentários por categoria e período
const Meta = sequelize.define('Meta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: false,                 // Categoria é obrigatória para vincular o limite
  },
  limite: {
    type: DataTypes.FLOAT,
    allowNull: false,                 // Valor máximo permitido para gastos na categoria
  },
  mes: {
    type: DataTypes.INTEGER,          // Mês de vigência da meta
  },
  ano: {
    type: DataTypes.INTEGER,          // Ano de vigência da meta
  },
}, {
  tableName: 'metas',                 // Nome explícito da tabela
  timestamps: true,                   // Mantém registro de criação e última atualização da meta
});

// Função assíncrona responsável por sincronizar os modelos com o banco de dados
const inicializarBanco = async () => {
  // { alter: true } permite que o Sequelize ajuste a estrutura das tabelas (adicionar/remover colunas) 
  // sem apagar os dados existentes
  await sequelize.sync({ alter: true });
  console.log('✅ Banco de dados sincronizado');
};

// Exporta os módulos para que possam ser importados e reutilizados em outros arquivos do projeto
export { sequelize, Transacao, Meta, inicializarBanco };