// Importa os módulos principais do Sequelize (ORM para Node.js) e os tipos de dados suportados
import { Sequelize, DataTypes } from 'sequelize';
// Carrega as variáveis de ambiente definidas no arquivo .env
import 'dotenv/config';

// Cria uma instância do Sequelize configurada para conectar a um banco SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',                  // Define o tipo de banco
  storage: process.env.DB_PATH || './finbot.db', // Caminho do arquivo do banco.
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
  tableName: 'transacoes',            
  timestamps: true,                   
});

export { sequelize, Transacao };