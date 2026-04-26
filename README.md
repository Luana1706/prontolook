# Pronto Look - Loja Online de Moda Feminina

E-commerce de moda feminina construído com Node.js, Express, PostgreSQL e frontend em HTML/CSS/JS.

## Tecnologias

- **Backend:** Node.js + Express
- **Banco de Dados:** PostgreSQL (Supabase)
- **Upload de Imagens:** Cloudinary
- **Autenticação:** JWT (JSON Web Tokens) + bcrypt
- **Deploy:** Vercel

## Pré-requisitos

- Node.js 18+
- PostgreSQL (ou conta no [Supabase](https://supabase.com))
- Conta no [Cloudinary](https://cloudinary.com)

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/Luana1706/prontolook.git
cd prontolook

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env
# Preencha as variáveis no arquivo .env

# Iniciar o servidor
npm start
```

O servidor rodará em `http://localhost:3000`.

## Variáveis de Ambiente

Veja `.env.example` para a lista completa de variáveis necessárias.

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud no Cloudinary |
| `CLOUDINARY_API_KEY` | API Key do Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret do Cloudinary |
| `FRONTEND_URL` | URL do frontend em produção (para CORS) |

## Estrutura do Projeto

```
prontolook/
├── server.js                    # Entrada principal do servidor
├── db.js                        # Conexão com PostgreSQL
├── package.json
├── vercel.json                  # Configuração de deploy Vercel
├── server/
│   ├── middleware/
│   │   └── auth.js              # Middleware JWT (autenticar, apenasAdmin)
│   ├── config/
│   │   └── cloudinary.js        # Configuração do Cloudinary
│   └── routes/
│       ├── usuarios.js          # Cadastro, login, recuperar senha
│       ├── produtos.js          # Listar e adicionar produtos
│       └── carrinho.js          # Gerenciar carrinho de compras
└── frontend/
    ├── index.html               # Página principal (vitrine)
    ├── login.html               # Login
    ├── cadastro.html            # Cadastro de usuário
    ├── carrinho.html            # Carrinho de compras
    ├── checkout.html            # Finalizar pagamento
    ├── admin.html               # Painel administrativo
    ├── recuperar.html           # Recuperação de senha
    ├── style.css                # Estilos
    ├── script.js                # JavaScript principal
    ├── carrinho_script.js       # Script do carrinho
    └── assets/                  # Imagens estáticas
```

## API - Rotas

### Usuários
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| POST | `/usuarios/cadastro` | Não | Criar nova conta |
| POST | `/usuarios/login` | Não | Login (retorna JWT) |
| POST | `/usuarios/recuperar-senha` | Não | Redefinir senha |
| GET | `/usuarios/verificar` | JWT | Verificar token |

### Produtos
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| GET | `/produtos` | Não | Listar todos os produtos |
| POST | `/produtos/adicionar` | JWT (Admin) | Cadastrar novo produto |

### Carrinho
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| POST | `/carrinho/adicionar` | JWT | Adicionar item ao carrinho |
| GET | `/carrinho` | JWT | Ver itens do carrinho |
| DELETE | `/carrinho/remover/:id` | JWT | Remover item do carrinho |

## Segurança

- Senhas hasheadas com **bcrypt**
- Autenticação via **JWT** em rotas protegidas
- **Helmet** para headers HTTP seguros
- **Rate limiting** nas rotas de autenticação
- **CORS** configurado com origens permitidas
- Validação de dados com **express-validator**

## Deploy na Vercel

O projeto já está configurado para deploy na Vercel. Basta conectar o repositório e configurar as variáveis de ambiente no painel da Vercel.

## Licença

Este projeto é privado.
