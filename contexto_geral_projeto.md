# Contexto Geral do Projeto - Curumim News

## Visão Geral
O Curumim News é um portal de notícias moderno e interativo desenvolvido com tecnologias web puras (HTML5, CSS3 e JavaScript ES6+) no front-end e Supabase como solução serverless para o back-end. O portal é projetado para ser esteticamente atraente, responsivo e de alto desempenho, sem depender de frameworks complexos.

## Tecnologias Utilizadas
- **Front-end**: HTML5, CSS3 (puro, mobile-first), JavaScript ES6+ (módulos nativos)
- **Back-end**: Supabase (autenticação, banco de dados PostgreSQL, storage)
- **Implementação**: SPA leve usando History API ou páginas HTML separadas com fetch/async

## Identidade Visual
- **Cores primárias**:
  - Verde escuro: #388E3C
  - Amarelo mostarda: #FBC02D
- **Cores secundárias**:
  - Vermelho rubi: #D32F2F
  - Cinza-escuro (texto): #333333
- **Fundo**: Branco (#FFFFFF)

## Estrutura de Pastas
```
/
├── index.html             ← página inicial (home)
├── noticia.html           ← template para detalhe de notícia
├── curiosidades.html      ← listagem de curiosidades
├── sobre.html             ← sobre o portal
├── admin/
│    ├── login.html        ← form de login para admins
│    ├── dashboard.html    ← painel principal (CRUD)
│    └── editor.html       ← formulário de criação/edição
├── assets/
│    ├── css/
│    │    └── style.css    ← CSS puro (mobile-first, responsivo)
│    ├── js/
│    │    ├── main.js      ← lógica de SPA ou roteamento simples
│    │    ├── api.js       ← wrapper genérico para chamadas ao Supabase
│    │    ├── home.js      ← renderização da home
│    │    ├── noticia.js   ← detalhe da notícia
│    │    └── admin.js     ← login, autenticação e CRUD
│    └── img/              ← imagens estáticas (ícones, logo)
└── README.md              ← instruções de setup
```

## Estrutura do Banco de Dados (Supabase)
- **Tabelas**:
  - `posts` (id, titulo, slug, resumo, corpo, data_publicacao, author_id, image_path, fonte)
  - `curiosidades` (id, texto, data, author_id)
  - `users` (id, email, senha, role)
- **Storage**:
  - Bucket `news-images` para armazenamento de mídia

## Funcionalidades Principais
1. **Portal Público**:
   - Exibição de notícias recentes
   - Visualização detalhada de notícias
   - Seção de curiosidades
   - Página institucional

2. **Painel Administrativo**:
   - Autenticação segura
   - CRUD completo para notícias e curiosidades
   - Editor WYSIWYG para conteúdo
   - Upload e gerenciamento de imagens

## Elementos de Design e UX
- Interface moderna e interativa
- Animações CSS para transições
- Glassmorphism e efeitos visuais avançados
- Dark mode
- Microinterações e feedback visual
- Loading skeletons e lazy loading
- Componentes inspirados no 21st.dev

## Segurança
- Autenticação segura via Supabase
- Row Level Security (RLS) para proteção de dados
- Tokens JWT para requisições protegidas

## Requisitos de Implementação
- 100% responsivo (mobile-first)
- Código modular e bem estruturado
- Performance otimizada
- Acessibilidade (WCAG)
- Compatibilidade com navegadores modernos 