// Importa os módulos do Sequelize
import { Sequelize, DataTypes } from 'sequelize';

// Carrega variáveis do arquivo .env
import 'dotenv/config';

// Cria a conexão com o banco SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || './finbot.db',
  logging: false,
});

// Modelo de transações financeiras
const Transacao = sequelize.define('Transacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo: {
    type: DataTypes.ENUM('gasto', 'receita'),
    allowNull: false,
  },
  valor: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING,
    defaultValue: 'outros',
  },
  data: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  mes: {
    type: DataTypes.INTEGER,
  },
  ano: {
    type: DataTypes.INTEGER,
  },
  mensagemOriginal: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'transacoes',
  timestamps: true,
});


// Inicializa o banco
async function inicializarBanco() {
  try {
    await sequelize.sync();
    console.log('✅ Banco inicializado.');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err);
    throw err;
  }
}


// Exporta tudo que será utilizado em outros arquivos
export {
  sequelize,
  Transacao,
  inicializarBanco
};