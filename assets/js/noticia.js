/**
 * Curumim News - Página de Notícia Individual
 * 
 * Este script carrega dinamicamente o conteúdo de uma notícia específica
 * baseado no slug ou id fornecido na URL
 */

import api from './api.js';
import { Utils, Toast, Loader } from './main.js';

// Estado da página
const state = {
  noticia: null,
  noticiasSugeridas: []
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('Curumim News - Página de Notícia inicializada');
  inicializarPagina();
});

/**
 * Inicializa a página de notícia
 */
async function inicializarPagina() {
  try {
    // Exibir loader enquanto carrega
    mostrarLoading(true);
    
    // Obter parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const id = params.get('id');
    
    if (!slug && !id) {
      throw new Error('Parâmetro slug ou id não encontrado na URL');
    }
    
    // Buscar notícia pelo slug ou id
    let resultado;
    if (slug) {
      resultado = await api.posts.getBySlug(slug);
    } else if (id) {
      resultado = await api.posts.getById(id);
    }
    
    if (!resultado || !resultado.success || !resultado.data) {
      throw new Error('Notícia não encontrada');
    }
    
    // Armazenar notícia no estado
    state.noticia = resultado.data;
    
    // Atualizar o título da página
    document.title = `${state.noticia.titulo} | Curumim News`;
    
    // Renderizar conteúdo da notícia
    renderizarNoticia(state.noticia);
    
    // Registrar visualização
    await api.stats.registrarVisualizacao(state.noticia.id, 'post');
    console.log('Visualização registrada para notícia ID:', state.noticia.id);
    
    // Buscar notícias sugeridas
    buscarNoticiasSugeridas();
    
  } catch (error) {
    console.error('Erro ao carregar notícia:', error);
    exibirMensagemErro(error.message);
  } finally {
    // Esconder loader
    mostrarLoading(false);
  }
}

/**
 * Renderiza o conteúdo da notícia na página
 * @param {Object} noticia - Objeto com dados da notícia
 */
function renderizarNoticia(noticia) {
  // Atualizar categoria
  const categoriaEl = document.querySelector('.article-category');
  if (categoriaEl) {
    categoriaEl.textContent = noticia.categoria || 'Notícia';
  }
  
  // Atualizar data
  const dataEl = document.querySelector('.article-date time');
  if (dataEl) {
    const dataFormatada = Utils.formatDate(noticia.data_publicacao, true);
    dataEl.textContent = dataFormatada;
    dataEl.setAttribute('datetime', new Date(noticia.data_publicacao).toISOString().split('T')[0]);
  }
  
  // Atualizar título
  const tituloEl = document.querySelector('.article-title');
  if (tituloEl) {
    tituloEl.textContent = noticia.titulo;
  }
  
  // Atualizar fonte original
  const fonteEl = document.querySelector('.source-link');
  if (fonteEl) {
    const fonteName = noticia.fonte_original || 'Curumim News';
    fonteEl.textContent = fonteName;
    
    // Adicionar link para a fonte original se existir uma URL
    if (noticia.fonte_url) {
      fonteEl.href = noticia.fonte_url;
    } else {
      fonteEl.href = '#';
      fonteEl.removeAttribute('target');
    }
  }
  
  // Atualizar imagem de destaque
  const imagemEl = document.querySelector('.article-featured-image img');
  if (imagemEl) {
    imagemEl.src = noticia.image_path || 'assets/img/news-placeholder.jpg';
    imagemEl.alt = noticia.titulo;
  }
  
  // Atualizar legenda da imagem
  const legendaEl = document.querySelector('.image-caption');
  if (legendaEl) {
    legendaEl.textContent = noticia.legenda_imagem || noticia.titulo;
  }
  
  // Atualizar conteúdo principal
  const conteudoEl = document.querySelector('.article-content');
  if (conteudoEl) {
    conteudoEl.innerHTML = noticia.corpo;
  }
  
  // Extrair palavras-chave e atualizar tags
  const tagsEl = document.querySelector('.tags-list');
  if (tagsEl) {
    // Usar tags existentes ou extrair do conteúdo
    let tags = [];
    
    if (noticia.tags && noticia.tags.length > 0) {
      // Usar tags já definidas
      tags = noticia.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else {
      // Extrair palavras-chave do conteúdo
      tags = extrairPalavrasChave(noticia.titulo, noticia.corpo, noticia.categoria);
    }
    
    if (tags.length > 0) {
      tagsEl.innerHTML = tags.map(tag => `
        <li><a href="/?tag=${encodeURIComponent(tag)}">${tag}</a></li>
      `).join('');
    } else {
      // Esconder seção de tags se não houver
      const tagSection = document.querySelector('.article-tags');
      if (tagSection) tagSection.style.display = 'none';
    }
  }
  
  // Configurar botões de compartilhamento
  configurarBotoesCompartilhamento(noticia);
}

/**
 * Extrai palavras-chave do conteúdo da notícia
 * @param {string} titulo - Título da notícia
 * @param {string} corpo - Corpo da notícia
 * @param {string} categoria - Categoria da notícia
 * @returns {Array} Array de palavras-chave extraídas
 */
function extrairPalavrasChave(titulo, corpo, categoria) {
  // Combinar título e corpo para análise
  const texto = `${titulo} ${corpo}`;
  
  // Remover HTML tags
  const textoLimpo = texto.replace(/<[^>]*>/g, ' ');
  
  // Converter para minúsculas
  const textoMinusculo = textoLimpo.toLowerCase();
  
  // Palavras a ignorar (stopwords em português)
  const stopwords = [
    'a', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo', 'as', 'até',
    'com', 'como', 'da', 'das', 'de', 'dela', 'delas', 'dele', 'deles', 'depois',
    'do', 'dos', 'e', 'ela', 'elas', 'ele', 'eles', 'em', 'entre', 'era', 'eram',
    'essa', 'essas', 'esse', 'esses', 'esta', 'estas', 'este', 'estes', 'eu',
    'foi', 'foram', 'for', 'havia', 'isso', 'isto', 'já', 'lhe', 'lhes', 'mais',
    'mas', 'me', 'mesmo', 'meu', 'meus', 'minha', 'minhas', 'muito', 'na', 'não',
    'nas', 'nem', 'no', 'nos', 'nós', 'nossa', 'nossas', 'nosso', 'nossos', 'num',
    'o', 'os', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos', 'por', 'qual',
    'quando', 'que', 'quem', 'são', 'se', 'seja', 'sem', 'seu', 'seus', 'só',
    'sua', 'suas', 'também', 'te', 'tem', 'tém', 'tinha', 'tua', 'tuas', 'teu',
    'teus', 'tu', 'um', 'uma', 'você', 'vocês', 'vos'
  ];
  
  // Dividir em palavras
  const palavras = textoMinusculo.split(/\W+/);
  
  // Filtrar stopwords e palavras muito curtas
  const palavrasFiltradas = palavras.filter(palavra => 
    !stopwords.includes(palavra) && palavra.length > 3
  );
  
  // Contar frequência das palavras
  const contagem = {};
  palavrasFiltradas.forEach(palavra => {
    contagem[palavra] = (contagem[palavra] || 0) + 1;
  });
  
  // Ordenar palavras por frequência
  const palavrasOrdenadas = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a]);
  
  // Pegar as 5 palavras mais frequentes
  let tags = palavrasOrdenadas.slice(0, 5);
  
  // Adicionar a categoria como tag se ainda não estiver incluída
  if (categoria && !tags.includes(categoria.toLowerCase())) {
    tags.unshift(categoria);
  }
  
  // Capitalizar primeira letra de cada tag
  tags = tags.map(tag => tag.charAt(0).toUpperCase() + tag.slice(1));
  
  return tags;
}

/**
 * Busca notícias sugeridas aleatórias
 */
async function buscarNoticiasSugeridas() {
  try {
    // Buscar lista de notícias
    const { success, data } = await api.posts.getList(1, 12);
    
    if (!success || !data || data.length === 0) {
      // Ocultar seção se não houver notícias
      ocultarSecaoSugestoes();
      return;
    }
    
    // Filtrar para remover a notícia atual
    const outrasnoticias = data.filter(n => n.id !== state.noticia.id);
    
    if (outrasnoticias.length === 0) {
      ocultarSecaoSugestoes();
      return;
    }
    
    // Embaralhar notícias para exibição aleatória
    const noticiasEmbaralhadas = embaralharArray(outrasnoticias);
    
    // Limitar a 3 notícias sugeridas
    state.noticiasSugeridas = noticiasEmbaralhadas.slice(0, 3);
    
    // Renderizar notícias sugeridas
    renderizarNoticiasSugeridas(state.noticiasSugeridas);
    
  } catch (error) {
    console.error('Erro ao buscar notícias sugeridas:', error);
    ocultarSecaoSugestoes();
  }
}

/**
 * Embaralha array de forma aleatória (algoritmo Fisher-Yates)
 * @param {Array} array - Array a ser embaralhado
 * @returns {Array} Array embaralhado
 */
function embaralharArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Oculta a seção de sugestões
 */
function ocultarSecaoSugestoes() {
  const secaoSugestoes = document.querySelector('.suggested-news');
  if (secaoSugestoes) secaoSugestoes.style.display = 'none';
}

/**
 * Renderiza as notícias sugeridas
 * @param {Array} noticias - Array de objetos de notícias sugeridas
 */
function renderizarNoticiasSugeridas(noticias) {
  const container = document.getElementById('suggested-news-container');
  if (!container) return;
  
  if (!noticias || noticias.length === 0) {
    ocultarSecaoSugestoes();
    return;
  }
  
  // Limpar container
  container.innerHTML = '';
  
  // Adicionar notícias sugeridas
  noticias.forEach(noticia => {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
      <div class="card-image">
        <img src="${noticia.image_path || 'assets/img/news-placeholder.jpg'}" alt="${noticia.titulo}">
        ${noticia.destaque ? '<div class="publisher-badge">GM</div>' : ''}
      </div>
      <h3 class="card-title">${noticia.titulo}</h3>
    `;
    
    // Adicionar evento de clique
    card.addEventListener('click', () => {
      window.location.href = `/noticia.html?slug=${noticia.slug}`;
    });
    
    container.appendChild(card);
  });
}

/**
 * Configura os botões de compartilhamento
 * @param {Object} noticia - Objeto da notícia
 */
function configurarBotoesCompartilhamento(noticia) {
  const titulo = encodeURIComponent(noticia.titulo);
  const url = encodeURIComponent(window.location.href);
  
  // Botão Facebook
  const facebookBtn = document.querySelector('.share-buttons .facebook');
  if (facebookBtn) {
    facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    facebookBtn.target = '_blank';
  }
  
  // Botão Twitter
  const twitterBtn = document.querySelector('.share-buttons .twitter');
  if (twitterBtn) {
    twitterBtn.href = `https://twitter.com/intent/tweet?text=${titulo}&url=${url}`;
    twitterBtn.target = '_blank';
  }
  
  // Botão WhatsApp
  const whatsappBtn = document.querySelector('.share-buttons .whatsapp');
  if (whatsappBtn) {
    whatsappBtn.href = `https://api.whatsapp.com/send?text=${titulo} ${url}`;
    whatsappBtn.target = '_blank';
  }
  
  // Botão Email
  const emailBtn = document.querySelector('.share-buttons .email');
  if (emailBtn) {
    emailBtn.href = `mailto:?subject=${titulo}&body=${url}`;
  }
}

/**
 * Exibe/oculta o indicador de carregamento
 * @param {boolean} mostrar - Se deve mostrar ou ocultar o loader
 */
function mostrarLoading(mostrar) {
  // Verificar se já existe um loader
  let loader = document.querySelector('.page-loader');
  
  if (mostrar) {
    if (!loader) {
      // Criar loader
      loader = document.createElement('div');
      loader.className = 'page-loader';
      loader.innerHTML = '<div class="loader-spinner"></div><p>Carregando notícia...</p>';
      document.body.appendChild(loader);
    }
    // Exibir loader
    loader.style.display = 'flex';
  } else if (loader) {
    // Ocultar loader
    loader.style.display = 'none';
  }
}

/**
 * Exibe uma mensagem de erro na página
 * @param {string} mensagem - Mensagem de erro a ser exibida
 */
function exibirMensagemErro(mensagem) {
  // Ocultar artigo
  const artigo = document.querySelector('.article-container');
  if (artigo) artigo.style.display = 'none';
  
  // Ocultar seção de notícias relacionadas
  const relacionadas = document.querySelector('.suggested-news');
  if (relacionadas) relacionadas.style.display = 'none';
  
  // Criar mensagem de erro
  const erro = document.createElement('div');
  erro.className = 'error-container';
  erro.innerHTML = `
    <div class="container">
      <h1 class="error-title">Notícia não encontrada</h1>
      <p class="error-message">${mensagem}</p>
      <a href="/" class="btn-primary">Voltar para a página inicial</a>
    </div>
  `;
  
  // Adicionar ao main
  const main = document.querySelector('main');
  if (main) {
    main.appendChild(erro);
  } else {
    document.body.appendChild(erro);
  }
}

// Adicionar estilos para o loader e mensagens de erro
const adicionarEstilos = () => {
  const estilos = document.createElement('style');
  estilos.textContent = `
    .page-loader {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    .loader-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: var(--verde-escuro);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-container {
      padding: 60px 0;
      text-align: center;
    }
    
    .error-title {
      font-size: 2rem;
      margin-bottom: 20px;
      color: var(--cinza-escuro);
    }
    
    .error-message {
      font-size: 1.1rem;
      margin-bottom: 30px;
      color: var(--cor-texto);
    }
  `;
  
  document.head.appendChild(estilos);
};

// Adicionar estilos ao carregar
adicionarEstilos(); 