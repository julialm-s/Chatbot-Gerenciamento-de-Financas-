// Importa as variáveis de ambiente do arquivo .env
import 'dotenv/config';

// Importa o framework Express para criar a API RESTful.
import express from 'express';

// Importa o middleware CORS para permitir requisições de diferentes origens.
import cors from 'cors';

// Importa a função responsável por inicializar o banco de dados.
import { inicializarBanco } from './models/index.js';

//  Importa a função responsável por conectar o bot do WhatsApp.
import {conectar} from './bot/index.js';

// Importa as rotas da API definidas no arquivo routes.js.
import apiRoutes from './api/routes.js';

// Cria uma instância do aplicativo Express.
const app = express();

//  Define a porta em que a API irá escutar. Se não houver uma variável de ambiente definida, utiliza a porta 3000 como padrão.
const PORT = process.env.PORT || 3000;

// Permite que a API aceite requisições de qualquer origem, útil para desenvolvimento e testes.
app.use(cors());

// Permite que a API interprete requisições com corpo em formato JSON.
app.use(express.json());

// Rota raiz da API, que retorna um status de funcionamento e a versão atual.
app.get('/', (req, res) => {

  res.json({
    status: 'online',
    versao: '1.0.0'
  });

});


// Define que todas as rotas que começam com "/api" serão tratadas pelo conjunto de rotas definido em apiRoutes.
app.use('/api', apiRoutes);


// Função principal responsável por iniciar o sistema.
 
async function iniciar() {

  try {

    // Inicializa o banco de dados e cria as tabelas, caso ainda não existam.
     
    await inicializarBanco();


    // Inicia o servidor da API.
    
    app.listen(PORT, () => {

      console.log(
        `🚀 API rodando em http://localhost:${PORT}`
      );

      console.log(
        `📡 App Android deve apontar para esta URL`
      );

    });


    // Inicializa o bot do WhatsApp após o servidor estar ativo.
    
    console.log('🤖 Iniciando bot WhatsApp...');

    await conectar();

  } catch (err) {

    // Caso ocorra algum erro durante a inicialização, exibe a mensagem no console e encerra a aplicação.
     
    console.error('❌ Erro ao iniciar:', err);

    process.exit(1);

  }
}


//  Executa a função principal e inicia todo o sistema.
 
iniciar();