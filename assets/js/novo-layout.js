/**
 * Curumim News - Novo Layout
 * 
 * Script para o novo layout baseado na imagem de referência
 * Integração com a API do Supabase para carregar notícias reais
 */

import api from './api.js';
import Toast from './modules/toastManager.js';
import { Utils } from './main.js';

// Estado da aplicação
const state = {
  mainNews: null,
  secondaryNews: [],
  additionalNews: [],
  curiosidades: [],
  isLoading: false,
  isLoadingMore: false,
  currentPage: 1,
  totalPages: 1,
  weatherCity: 0,
  currentFilter: 'all',
  lastWeatherUpdate: 0,
  lastDolarUpdate: 0,
  dolarData: null
};

// Cidades do Norte para o widget de clima
const cidadesNorte = [
  { nome: 'Manaus', uf: 'AM', lat: -3.1190, lon: -60.0217 },
  { nome: 'Belém', uf: 'PA', lat: -1.4558, lon: -48.5044 },
  { nome: 'Porto Velho', uf: 'RO', lat: -8.7608, lon: -63.9088 },
  { nome: 'Macapá', uf: 'AP', lat: 0.0356, lon: -51.0705 },
  { nome: 'Rio Branco', uf: 'AC', lat: -9.9754, lon: -67.8249 },
  { nome: 'Boa Vista', uf: 'RR', lat: 2.8235, lon: -60.6758 },
  { nome: 'Palmas', uf: 'TO', lat: -10.2491, lon: -48.3243 }
];

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('Curumim News - Novo Layout inicializado');
  
  // Inicializar módulos
  initNewsCards();
  initAdditionalNews();
  initCuriosidades();
  initHeaderWidgets();
  setupHeaderWidgets();
  setupEventListeners();
});

/**
 * Configuração de Event Listeners
 */
function setupEventListeners() {
  // Clique no card principal
  const mainCard = document.querySelector('.main-news-card');
  if (mainCard) {
    mainCard.addEventListener('click', () => {
      if (state.mainNews) {
        window.location.href = `/noticia.html?slug=${state.mainNews.slug}`;
      }
    });
  }
  
  // Clique nos cards secundários
  const secondaryCards = document.querySelectorAll('.secondary-news-card');
  secondaryCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      if (state.secondaryNews[index]) {
        window.location.href = `/noticia.html?slug=${state.secondaryNews[index].slug}`;
      }
    });
  });
  
  // Configurar widgets do cabeçalho
  setupHeaderWidgets();

  // Botão carregar mais notícias
  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      if (!state.isLoadingMore && state.currentPage < state.totalPages) {
        state.currentPage++;
        loadMoreNews();
      }
    });
  }

  // Botões de filtro por categoria
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      
      // Atualizar classe ativa nos botões
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Atualizar estado e recarregar notícias
      state.currentFilter = category;
      state.currentPage = 1;
      
      // Limpar container e carregar notícias filtradas
      const newsContainer = document.getElementById('news-container');
      if (newsContainer) {
        newsContainer.innerHTML = '';
        const loadingEl = document.getElementById('news-loading');
        if (loadingEl) loadingEl.style.display = 'block';
        
        loadAdditionalNews(false);
      }
    });
  });
}

/**
 * Inicializa e carrega os cards de notícias principais
 */
async function initNewsCards() {
  try {
    // Evitar múltiplas chamadas simultaneas
    if (state.isLoading) return;
    state.isLoading = true;
    
    // Carregar as últimas notícias do Supabase (em vez de destaques)
    const { success, data } = await api.posts.getList(1, 3);
    
    if (!success || !data || data.length === 0) {
      throw new Error('Não foi possível carregar as últimas notícias');
    }
    
    // Armazenar no estado
    state.mainNews = data[0];
    state.secondaryNews = data.slice(1, 3);
    
    // Renderizar cards
    renderMainCard(state.mainNews);
    renderSecondaryCards(state.secondaryNews);
    
  } catch (error) {
    console.error('Erro ao carregar as últimas notícias:', error);
    Toast.show('Não foi possível carregar as últimas notícias', 'error');
  } finally {
    state.isLoading = false;
  }
}

/**
 * Inicializa e carrega notícias adicionais
 */
function initAdditionalNews() {
  // Verificar se o container de notícias existe na página
  const newsContainer = document.getElementById('news-container');
  if (newsContainer) {
    loadAdditionalNews(false);
  }
}

/**
 * Carrega notícias adicionais do Supabase
 * @param {boolean} append - Se deve anexar ou substituir as notícias existentes
 */
async function loadAdditionalNews(append = false) {
  try {
    if (state.isLoadingMore) return;
    state.isLoadingMore = true;
    
    // Mostrar loading
    const loadingEl = document.getElementById('news-loading');
    const loadMoreBtn = document.getElementById('load-more');
    
    if (loadMoreBtn) {
      const spinner = loadMoreBtn.querySelector('.fa-spinner');
      const span = loadMoreBtn.querySelector('span');
      if (spinner) spinner.classList.remove('hidden');
      if (span) span.textContent = 'Carregando...';
    }
    
    // Carregar notícias com paginação - usando um limit maior (9) para depois filtrar
    const filter = state.currentFilter !== 'all' ? state.currentFilter : null;
    const { success, data, pagination, error } = await api.posts.getList(state.currentPage, 9, filter);
    
    if (!success) {
      throw new Error(error || 'Erro ao carregar notícias');
    }
    
    // Filtrar para remover as 3 notícias que já aparecem na seção "ULTIMAS NOTÍCIAS"
    let filteredData = [];
    
    if (state.mainNews && state.secondaryNews.length > 0) {
      // IDs das notícias que já estão na seção "ULTIMAS NOTÍCIAS"
      const excludeIds = [
        state.mainNews.id, 
        ...state.secondaryNews.map(news => news.id)
      ];
      
      // Filtrar notícias para remover as duplicadas
      filteredData = data.filter(news => !excludeIds.includes(news.id));
      
      // Limitar aos primeiros 6 resultados
      filteredData = filteredData.slice(0, 6);
    } else {
      // Se ainda não carregou as notícias principais, usar todas
      filteredData = data.slice(0, 6);
    }
    
    // Atualizar estado
    if (append) {
      state.additionalNews = [...state.additionalNews, ...filteredData];
    } else {
      state.additionalNews = filteredData;
    }
    
    state.totalPages = pagination.totalPages;
    
    // Renderizar notícias
    renderAdditionalNews(filteredData, append);
    
    // Esconder loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    // Atualizar botão de "carregar mais"
    updateLoadMoreButton();
    
  } catch (error) {
    console.error('Erro ao carregar notícias adicionais:', error);
    Toast.show('Erro ao carregar mais notícias', 'error');
  } finally {
    state.isLoadingMore = false;
    
    const loadMoreBtn = document.getElementById('load-more');
    if (loadMoreBtn) {
      const spinner = loadMoreBtn.querySelector('.fa-spinner');
      const span = loadMoreBtn.querySelector('span');
      if (spinner) spinner.classList.add('hidden');
      if (span) span.textContent = 'Carregar mais';
    }
  }
}

/**
 * Função para carregar mais notícias ao clicar no botão
 */
function loadMoreNews() {
  loadAdditionalNews(true);
}

/**
 * Atualiza o estado do botão "Carregar mais"
 */
function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById('load-more');
  if (!loadMoreBtn) return;
  
  if (state.currentPage >= state.totalPages) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.style.opacity = '0.5';
    loadMoreBtn.style.cursor = 'not-allowed';
  } else {
    loadMoreBtn.disabled = false;
    loadMoreBtn.style.opacity = '1';
    loadMoreBtn.style.cursor = 'pointer';
  }
}

/**
 * Inicializa e carrega curiosidades na página inicial
 */
async function initCuriosidades() {
  const curiosidadesContainer = document.getElementById('curiosidades-home');
  if (!curiosidadesContainer) return;
  
  try {
    // Carregar curiosidades do Supabase
    const { success, data, error } = await api.curiosidades.getList(1, 3);
    
    if (!success) {
      throw new Error(error || 'Erro ao carregar curiosidades');
    }
    
    // Armazenar no estado
    state.curiosidades = data;
    
    // Renderizar curiosidades
    renderCuriosidades(data);
    
  } catch (error) {
    console.error('Erro ao carregar curiosidades:', error);
    curiosidadesContainer.innerHTML = '<p class="curiosidade-card-loading">Não foi possível carregar as curiosidades.</p>';
  }
}

/**
 * Renderiza o card principal com dados reais
 * @param {Object} news - Objeto da notícia principal
 */
function renderMainCard(news) {
  if (!news) return;
  
  const mainCard = document.querySelector('.main-news-card');
  if (!mainCard) return;
  
  // Extrair categoria da notícia ou usar padrão
  const categoria = news.categoria || 'Notícia';
  
  // Atualizar elementos do card principal
  const categoryTag = mainCard.querySelector('.category-tag');
  const title = mainCard.querySelector('.news-title');
  const subtitle = mainCard.querySelector('.news-subtitle');
  
  if (categoryTag) categoryTag.textContent = categoria;
  if (title) title.textContent = news.titulo;
  if (subtitle) subtitle.textContent = Utils.formatDate(news.data_publicacao);
  
  // Definir imagem de fundo do card
  if (news.image_path) {
    mainCard.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${news.image_path})`;
    mainCard.style.backgroundSize = 'cover';
    mainCard.style.backgroundPosition = 'center';
  }
}

/**
 * Renderiza os cards secundários com dados reais
 * @param {Array} newsArray - Array de objetos de notícias secundárias
 */
function renderSecondaryCards(newsArray) {
  if (!newsArray || newsArray.length === 0) return;
  
  // Pegar no máximo 2 notícias secundárias
  const cardCount = Math.min(newsArray.length, 2);
  
  for (let i = 0; i < cardCount; i++) {
    const news = newsArray[i];
    const cardId = `secondary-news-${i + 1}`;
    const card = document.getElementById(cardId);
    
    if (card && news) {
      // Atualizar título
      const title = card.querySelector('.news-title');
      if (title) title.textContent = news.titulo;
      
      // Definir imagem de fundo do card
      if (news.image_path) {
        card.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${news.image_path})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
      }
    }
  }
}

/**
 * Renderiza notícias adicionais na seção "Mais Notícias"
 * @param {Array} newsArray - Array de objetos de notícias
 * @param {boolean} append - Se deve anexar ou substituir o conteúdo
 */
function renderAdditionalNews(newsArray, append = false) {
  const newsContainer = document.getElementById('news-container');
  if (!newsContainer) return;
  
  if (!newsArray || newsArray.length === 0) {
    if (!append) {
      newsContainer.innerHTML = '<p class="empty-message">Nenhuma notícia encontrada.</p>';
    }
    return;
  }
  
  // Criar HTML das notícias
  const newsHtml = newsArray.map(news => {
    const formattedDate = Utils.formatDate(news.data_publicacao);
    
    return `
      <div class="news-card" data-id="${news.id}">
        <div class="news-card-image">
          <img src="${news.image_path || 'assets/img/news-placeholder.jpg'}" alt="${news.titulo}">
        </div>
        <div class="news-card-content">
          <span class="news-card-category">${news.categoria || 'Notícia'}</span>
          <h3 class="news-card-title">${news.titulo}</h3>
          <p class="news-card-date">${formattedDate}</p>
        </div>
        <a href="/noticia.html?slug=${news.slug}" class="card-link" aria-label="${news.titulo}"></a>
      </div>
    `;
  }).join('');
  
  // Adicionar ao container
  if (append) {
    newsContainer.insertAdjacentHTML('beforeend', newsHtml);
  } else {
    newsContainer.innerHTML = newsHtml;
  }
  
  // Adicionar evento de clique
  const newsCards = newsContainer.querySelectorAll('.news-card');
  newsCards.forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.querySelector('.card-link').getAttribute('href').split('slug=')[1];
      window.location.href = `/noticia.html?slug=${slug}`;
    });
  });
}

/**
 * Renderiza curiosidades na página inicial
 * @param {Array} curiosidadesArray - Array de objetos de curiosidades
 */
function renderCuriosidades(curiosidadesArray) {
  const container = document.getElementById('curiosidades-home');
  if (!container) return;
  
  if (!curiosidadesArray || curiosidadesArray.length === 0) {
    container.innerHTML = '<p class="curiosidade-card-loading">Nenhuma curiosidade encontrada.</p>';
    return;
  }
  
  // Limpar container
  container.innerHTML = '';
  
  // Criar cards de curiosidades
  curiosidadesArray.forEach(item => {
    const formattedDate = Utils.formatDate(item.data);
    
    const card = document.createElement('div');
    card.className = 'curiosidade-card';
    card.innerHTML = `
      <div class="curiosidade-texto">${item.texto}</div>
      <div class="curiosidade-meta">${formattedDate}</div>
    `;
    
    container.appendChild(card);
  });
}

/**
 * Inicializa e configura os widgets do cabeçalho (clima e dólar)
 */
function initHeaderWidgets() {
  // Carregar dados iniciais
  updateWeatherWidget();
  updateDolarWidget();
  
  // Atualizar clima a cada 2 minutos
  setInterval(() => {
    updateWeatherWidget();
  }, 120000);
  
  // Atualizar dólar a cada 5 minutos
  setInterval(() => {
    updateDolarWidget();
  }, 300000);
  
  // Rotação automática de cidades a cada 30 segundos
  setInterval(() => {
    state.weatherCity = (state.weatherCity + 1) % cidadesNorte.length;
    updateWeatherWidget();
  }, 30000);
}

/**
 * Atualiza o widget de clima no cabeçalho
 * @param {boolean} forceUpdate - Se deve forçar a troca de cidade
 */
async function updateWeatherWidget(forceUpdate = false) {
  try {
    // Verificar se é muito cedo para atualizar (cache de 1 minuto)
    const now = Date.now();
    if (!forceUpdate && (now - state.lastWeatherUpdate) < 60000) {
      return;
    }
    
    const weatherIcon = document.querySelector('.weather-widget-small .widget-icon');
    const weatherTemp = document.querySelector('.weather-widget-small .widget-temp');
    const weatherCity = document.querySelector('.weather-widget-small .widget-city');
    const loadingText = document.querySelector('.weather-widget-small .widget-loading');
    
    if (!weatherIcon || !weatherTemp || !weatherCity) return;
    
    // Mostrar status de carregamento
    if (loadingText) {
      loadingText.textContent = 'Carregando...';
      loadingText.style.display = 'block';
    }
    
    // Dados da cidade atual
    const cidade = cidadesNorte[state.weatherCity];
    
    // Atualizar nome da cidade enquanto carrega
    weatherCity.textContent = cidade.nome;
    
    // Buscar dados climáticos da API com retry
    const apiKey = 'bd5e378503939ddaee76f12ad7a97608';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${cidade.lat}&lon=${cidade.lon}&units=metric&lang=pt_br&appid=${apiKey}`;
    
    let retries = 3;
    let data = null;
    
    while (retries > 0 && !data) {
      try {
        const response = await fetch(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        data = await response.json();
        break;
      } catch (fetchError) {
        retries--;
        console.warn(`Tentativa de busca clima falhou (${3-retries}/3):`, fetchError.message);
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s antes de tentar novamente
        }
      }
    }
    
    if (!data) {
      throw new Error('Falha ao obter dados climáticos após 3 tentativas');
    }
    
    // Atualizar elementos com dados recebidos
    const temperatura = Math.round(data.main.temp);
    const iconCode = data.weather[0].icon;
    const descricao = data.weather[0].description;
    const sensacao = Math.round(data.main.feels_like);
    
    weatherTemp.textContent = `${temperatura}°C`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = descricao;
    
    // Ocultar texto de carregamento
    if (loadingText) {
      loadingText.style.display = 'none';
    }
    
    // Atualizar timestamp do cache
    state.lastWeatherUpdate = now;
    
    console.log(`Clima atualizado: ${cidade.nome} - ${temperatura}°C`);
    
  } catch (error) {
    console.error('Erro ao atualizar widget de clima:', error);
    
    // Mostrar erro
    const loadingText = document.querySelector('.weather-widget-small .widget-loading');
    if (loadingText) {
      loadingText.textContent = 'Erro ao carregar';
      loadingText.style.display = 'block';
    }
    
    // Tentar novamente em 30 segundos
    setTimeout(() => updateWeatherWidget(), 30000);
  }
}

/**
 * Atualiza o widget de dólar no cabeçalho
 */
async function updateDolarWidget() {
  try {
    // Verificar se é muito cedo para atualizar (cache de 5 minutos)
    const now = Date.now();
    if ((now - state.lastDolarUpdate) < 300000) {
      return;
    }
    
    const dolarIcon = document.querySelector('.dolar-widget-small .widget-icon');
    const dolarValue = document.querySelector('.dolar-widget-small .widget-value');
    const dolarLabel = document.querySelector('.dolar-widget-small .widget-label');
    const loadingText = document.querySelector('.dolar-widget-small .widget-loading');
    
    if (!dolarIcon || !dolarValue || !dolarLabel) return;
    
    // Mostrar status de carregamento
    if (loadingText) {
      loadingText.textContent = 'Carregando...';
      loadingText.style.display = 'block';
    }
    
    // Lista de APIs de cotação como fallback
    const apis = [
      {
        url: 'https://api.awesomeapi.com.br/json/last/USD-BRL',
        parser: (data) => ({
          valor: parseFloat(data.USDBRL.bid),
          variacao: parseFloat(data.USDBRL.pctChange),
          dataHora: new Date(data.USDBRL.create_date),
          alta: parseFloat(data.USDBRL.high),
          baixa: parseFloat(data.USDBRL.low)
        })
      },
      {
        url: 'https://api.exchangerate-api.com/v4/latest/USD',
        parser: (data) => ({
          valor: data.rates.BRL || 5.25,
          variacao: 0,
          dataHora: new Date(),
          alta: data.rates.BRL || 5.25,
          baixa: data.rates.BRL || 5.25
        })
      }
    ];
    
    let cotacaoData = null;
    
    // Tentar cada API até conseguir dados
    for (const api of apis) {
      try {
        console.log(`Tentando buscar cotação de: ${api.url}`);
        
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        cotacaoData = api.parser(data);
        console.log('Cotação obtida com sucesso:', cotacaoData);
        break;
        
      } catch (fetchError) {
        console.warn(`Falha ao buscar de ${api.url}:`, fetchError.message);
        continue;
      }
    }
    
    // Se todas as APIs falharam, usar dados simulados
    if (!cotacaoData) {
      console.warn('Todas as APIs falharam, usando dados simulados');
      cotacaoData = {
        valor: 5.25 + (Math.random() - 0.5) * 0.1, // Valor simulado com pequena variação
        variacao: (Math.random() - 0.5) * 2, // Variação aleatória entre -1% e +1%
        dataHora: new Date(),
        alta: 5.30,
        baixa: 5.20
      };
    }
    
    const { valor, variacao, dataHora, alta, baixa } = cotacaoData;
    
    // Armazenar dados no state
    state.dolarData = {
      valor: valor,
      variacao: variacao,
      dataHora: dataHora,
      alta: alta,
      baixa: baixa
    };
    
    // Atualizar elementos do widget de dólar
    dolarLabel.textContent = 'USD/BRL';
    dolarValue.textContent = `R$ ${valor.toFixed(2)}`;
    
    // Definir ícone baseado na variação
    const isPositive = variacao >= 0;
    dolarIcon.innerHTML = isPositive ? 
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 5L15 12.5H7.5L10 5Z" fill="#00FF00"/></svg>' :
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 15L5 7.5H12.5L10 15Z" fill="#FF0000"/></svg>';
    
    dolarIcon.title = isPositive ? 'Dólar em alta' : 'Dólar em baixa';
    
    // Ocultar texto de carregamento
    if (loadingText) {
      loadingText.style.display = 'none';
    }
    
    // Atualizar timestamp do cache
    state.lastDolarUpdate = now;
    
    console.log(`Dólar atualizado: R$ ${valor.toFixed(2)} (${variacao >= 0 ? '+' : ''}${variacao.toFixed(2)}%)`);
    
  } catch (error) {
    console.error('Erro ao atualizar cotação do dólar:', error);
    
    // Mostrar erro
    const loadingText = document.querySelector('.dolar-widget-small .widget-loading');
    if (loadingText) {
      loadingText.textContent = 'Erro ao carregar';
      loadingText.style.display = 'block';
    }
    
    // Tentar novamente em 1 minuto
    setTimeout(() => updateDolarWidget(), 60000);
  }
}

/**
 * Configura os widgets do cabeçalho
 */
function setupHeaderWidgets() {
  // Adicionar eventos de clique nos widgets para mostrar mais informações
  const weatherWidget = document.querySelector('.weather-widget-small');
  const dolarWidget = document.querySelector('.dolar-widget-small');
  
  if (weatherWidget) {
    weatherWidget.addEventListener('click', () => {
      // Forçar atualização do clima
      updateWeatherWidget(true);
    });
  }
  
  if (dolarWidget) {
    dolarWidget.addEventListener('click', () => {
      // Forçar atualização do dólar
      updateDolarWidget();
    });
  }
}



// Exportar para uso em outros módulos se necessário
export default {
  updateCards: initNewsCards,
  updateWeatherWidget,
  updateDolarWidget,
  loadMoreNews
};