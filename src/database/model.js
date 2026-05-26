import { Sequelize, DataTypes } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || './finbot.db',
  logging: false,
});

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

const Meta = sequelize.define('Meta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  limite: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  mes: {
    type: DataTypes.INTEGER,
  },
  ano: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'metas',
  timestamps: true,
});

const inicializarBanco = async () => {
  await sequelize.sync({ alter: true });
  console.log('Banco de dados sincronizado');
};

export { sequelize, Transacao, Meta, inicializarBanco };