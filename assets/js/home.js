/**
 * Curumim News - Home
 * 
 * Gerencia funcionalidades específicas da página inicial (home):
 * - Carregamento dinâmico de notícias em destaque (carousel)
 * - Carregamento paginado de notícias recentes
 * - Filtragem de notícias por categoria
 */

import api from './api.js';
import { Utils, Toast, Loader } from './main.js';

// Controle global de estado da página
const state = {
  featuredNews: [],
  latestNews: [],
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  currentFilter: 'all',
  carouselIndex: 0
};

/**
 * Controlador do Carousel de Notícias em Destaque
 */
const FeaturedCarousel = {
  /**
   * Inicializa o carousel
   */
  init() {
    this.container = document.getElementById('featured-carousel');
    this.indicators = document.getElementById('carousel-indicators');
    this.prevBtn = document.querySelector('.carousel-control.prev');
    this.nextBtn = document.querySelector('.carousel-control.next');
    
    if (this.container && this.indicators) {
      this.loadFeaturedNews();
      this.setupControls();
    }
  },
  
  /**
   * Configura os controles do carousel
   */
  setupControls() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.navigate(-1);
      });
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.navigate(1);
      });
    }
    
    // Auto-rotação
    setInterval(() => {
      this.navigate(1);
    }, 7000);
  },
  
  /**
   * Carrega as notícias em destaque da API
   */
  async loadFeaturedNews() {
    try {
      const { success, data, error } = await api.posts.getFeatured(5);
      
      if (!success) {
        throw new Error(error || 'Erro ao carregar destaques');
      }
      
      state.featuredNews = data;
      this.renderCarousel(data);
    } catch (error) {
      console.error('Erro ao carregar destaques:', error);
      Toast.show('Não foi possível carregar os destaques', 'error');
      this.container.innerHTML = '<div class="error-message">Não foi possível carregar os destaques. Tente novamente mais tarde.</div>';
    }
  },
  
  /**
   * Renderiza o carousel com as notícias
   * @param {Array} news - Array de notícias 
   */
  renderCarousel(news) {
    if (!news || news.length === 0) {
      this.container.innerHTML = '<div class="empty-message">Nenhuma notícia em destaque encontrada</div>';
      return;
    }
    
    // Limpar conteúdo anterior
    this.container.innerHTML = '';
    this.indicators.innerHTML = '';
    
    // Criar slides
    news.forEach((item, index) => {
      // Slide
      const slide = document.createElement('div');
      slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
      slide.setAttribute('data-index', index);
      
      // Formatar data
      const formattedDate = Utils.formatDate(item.data_publicacao);
      
      slide.innerHTML = `
        <img src="${item.image_path}" alt="${item.titulo}" class="carousel-image">
        <div class="carousel-content">
          <h2 class="carousel-title">${item.titulo}</h2>
          <div class="carousel-meta">
            <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
            <span><i class="fas fa-user"></i> ${item.author_id || 'Redação'}</span>
          </div>
          <p class="carousel-excerpt">${Utils.truncateText(item.resumo, 20)}</p>
          <a href="/noticia.html?slug=${item.slug}" class="btn-primary">Ler mais</a>
        </div>
      `;
      
      // Adicionar ao container
      this.container.appendChild(slide);
      
      // Indicador
      const indicator = document.createElement('div');
      indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
      indicator.setAttribute('data-index', index);
      indicator.addEventListener('click', () => {
        this.goToSlide(index);
      });
      
      this.indicators.appendChild(indicator);
    });
    
    // Atualizar estado
    state.carouselIndex = 0;
  },
  
  /**
   * Navega para o próximo ou anterior slide
   * @param {number} direction - Direção (+1 para próximo, -1 para anterior)
   */
  navigate(direction) {
    if (state.featuredNews.length === 0) return;
    
    let newIndex = state.carouselIndex + direction;
    
    // Circular navigation
    if (newIndex < 0) {
      newIndex = state.featuredNews.length - 1;
    } else if (newIndex >= state.featuredNews.length) {
      newIndex = 0;
    }
    
    this.goToSlide(newIndex);
  },
  
  /**
   * Vai para um slide específico
   * @param {number} index - Índice do slide
   */
  goToSlide(index) {
    // Validar índice
    if (index < 0 || index >= state.featuredNews.length) return;
    
    // Atualizar slides
    const slides = this.container.querySelectorAll('.carousel-slide');
    slides.forEach(slide => {
      slide.classList.remove('active');
    });
    
    const targetSlide = this.container.querySelector(`.carousel-slide[data-index="${index}"]`);
    if (targetSlide) {
      targetSlide.classList.add('active');
    }
    
    // Atualizar indicadores
    const indicators = this.indicators.querySelectorAll('.indicator');
    indicators.forEach(indicator => {
      indicator.classList.remove('active');
    });
    
    const targetIndicator = this.indicators.querySelector(`.indicator[data-index="${index}"]`);
    if (targetIndicator) {
      targetIndicator.classList.add('active');
    }
    
    // Atualizar estado
    state.carouselIndex = index;
  }
};

/**
 * Controlador da Lista de Notícias
 */
const NewsList = {
  /**
   * Inicializa a lista de notícias
   */
  init() {
    this.newsGrid = document.getElementById('news-grid');
    this.loadMoreBtn = document.getElementById('load-more');
    this.filterSelect = document.getElementById('news-filter');
    
    if (this.newsGrid) {
      this.loadLatestNews();
      this.setupEventListeners();
    }
  },
  
  /**
   * Configura os listeners de evento
   */
  setupEventListeners() {
    // Botão "Carregar mais"
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        if (!state.isLoading && state.currentPage < state.totalPages) {
          state.currentPage++;
          this.loadLatestNews(true);
        }
      });
    }
    
    // Filtro de categorias
    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', () => {
        state.currentFilter = this.filterSelect.value;
        state.currentPage = 1;
        this.newsGrid.innerHTML = '';
        this.loadLatestNews();
      });
    }
  },
  
  /**
   * Carrega as notícias mais recentes da API
   * @param {boolean} append - Se deve anexar ou substituir o conteúdo
   */
  async loadLatestNews(append = false) {
    try {
      // Evitar múltiplas requisições simultâneas
      if (state.isLoading) return;
      state.isLoading = true;
      
      // Mostrar indicador de loading no botão
      if (this.loadMoreBtn) {
        const spinner = this.loadMoreBtn.querySelector('.fa-spinner');
        const span = this.loadMoreBtn.querySelector('span');
        spinner.classList.remove('hidden');
        span.textContent = 'Carregando...';
        this.loadMoreBtn.disabled = true;
      }
      
      // Carregar dados
      const { success, data, pagination, error } = 
        await api.posts.getList(state.currentPage, 6, state.currentFilter);
      
      if (!success) {
        throw new Error(error || 'Erro ao carregar notícias');
      }
      
      // Atualizar estado
      state.latestNews = append ? [...state.latestNews, ...data] : data;
      state.totalPages = pagination.totalPages;
      
      // Renderizar notícias
      this.renderNews(data, append);
      
      // Atualizar estado do botão "Carregar mais"
      this.updateLoadMoreButton();
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
      Toast.show('Não foi possível carregar as notícias', 'error');
      
      if (!append) {
        this.newsGrid.innerHTML = '<div class="error-message">Não foi possível carregar as notícias. Tente novamente mais tarde.</div>';
      }
    } finally {
      state.isLoading = false;
      
      // Restaurar botão
      if (this.loadMoreBtn) {
        const spinner = this.loadMoreBtn.querySelector('.fa-spinner');
        const span = this.loadMoreBtn.querySelector('span');
        spinner.classList.add('hidden');
        span.textContent = 'Carregar mais';
        this.loadMoreBtn.disabled = false;
      }
    }
  },
  
  /**
   * Renderiza as notícias no grid
   * @param {Array} news - Array de notícias 
   * @param {boolean} append - Se deve anexar ou substituir o conteúdo
   */
  renderNews(news, append = false) {
    // Verificar se há notícias
    if (!news || news.length === 0) {
      if (!append) {
        this.newsGrid.innerHTML = '<div class="empty-message">Nenhuma notícia encontrada</div>';
      }
      return;
    }
    
    // Limpar conteúdo anterior, se não for para anexar
    if (!append) {
      this.newsGrid.innerHTML = '';
    } else {
      // Remover skeletons quando anexando
      const skeletons = this.newsGrid.querySelectorAll('.skeleton-loader');
      skeletons.forEach(skeleton => {
        skeleton.remove();
      });
    }
    
    // Criar cards de notícia
    news.forEach(item => {
      const card = document.createElement('div');
      card.className = 'news-card';
      
      // Formatar data
      const formattedDate = Utils.formatDate(item.data_publicacao);
      
      // Determinar categoria ou usar padrão
      const category = item.categoria || 'Geral';
      
      card.innerHTML = `
        <div class="card-image">
          <span class="card-category">${category}</span>
          <img src="${item.image_path}" alt="${item.titulo}" loading="lazy">
        </div>
        <div class="card-content">
          <h3 class="card-title">${item.titulo}</h3>
          <div class="card-meta">
            <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
            <span><i class="fas fa-user"></i> ${item.author_id || 'Redação'}</span>
          </div>
          <p class="card-excerpt">${Utils.truncateText(item.resumo, 20)}</p>
          <a href="/noticia.html?slug=${item.slug}" class="card-link">Ler mais <i class="fas fa-arrow-right"></i></a>
        </div>
      `;
      
      // Adicionar ao grid
      this.newsGrid.appendChild(card);
    });
  },
  
  /**
   * Atualiza a visibilidade do botão "Carregar mais"
   */
  updateLoadMoreButton() {
    if (!this.loadMoreBtn) return;
    
    // Esconder botão se não houver mais páginas
    if (state.currentPage >= state.totalPages) {
      this.loadMoreBtn.style.display = 'none';
    } else {
      this.loadMoreBtn.style.display = 'flex';
    }
  }
};

/**
 * Inicialização da página Home
 */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar componentes da home
  FeaturedCarousel.init();
  NewsList.init();
  
  console.log('Curumim News - Home inicializada');
}); 