# 💰 FinBot — Bot Financeiro para WhatsApp

Bot de organização financeira via WhatsApp com API REST.

---


## 🚀 Instalação e Configuração

### 1. Instalar dependências

```bash
cd Chatbot-Gerenciamento-de-Financas
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
PORT=3000
MEU_NUMERO_WHATSAPP=5585999998888   # Seu número com código do país
```

### 3. Iniciar o projeto

```bash
npm start
```

Na primeira execução, um **QR Code** aparecerá no terminal.  
Abra o WhatsApp → **Dispositivos Conectados** → **Conectar um dispositivo** → Escaneie.
Entre no chat privado e envie uma mensagem com "configurar"

---

## 💬 Como usar o Bot

Mande mensagens para **seu próprio WhatsApp**:

| Ação | Exemplos |
|------|----------|
| Registrar gasto | `Gastei 50 no mercado` |
| | `Paguei 120 de conta de luz` |
| | `Comprei 35 de remédio` |
| Registrar receita | `Recebi 3000 de salário` |
| | `Ganhei 500 de freela` |
| Ver resumo | `resumo` |
| Ver histórico | `listar` ou `listar 20` |
| Definir meta | `meta alimentação 500` |
| Apagar | `apagar 15` (use o ID) |
| Ajuda | `ajuda` |

---

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/transacoes` | Listar transações |
| POST | `/api/transacoes` | Criar transação |
| DELETE | `/api/transacoes/:id` | Apagar transação |
| GET | `/api/resumo` | Resumo do mês |
| GET | `/api/evolucao` | Histórico de meses |
| GET | `/api/metas` | Listar metas |
| POST | `/api/metas` | Criar/atualizar meta |

### Exemplos com curl

```bash
# Resumo do mês atual
curl http://localhost:3000/api/resumo \
  -H "x-api-key: sua_chave"

# Listar transações de maio/2025
curl "http://localhost:3000/api/transacoes?mes=5&ano=2025" \
  -H "x-api-key: sua_chave"

---


## 🏗️ Próximos Passos

- [ ] Tela de dashboard no app Android com gráficos
- [ ] Notificações push quando atingir 80% da meta
- [ ] Relatório em PDF mensal
- [ ] Importar extrato bancário (OFX/CSV)
- [ ] Múltiplos usuários (um bot, vários números)