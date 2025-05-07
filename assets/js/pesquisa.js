/**
 * Curumim News - Página de Pesquisa
 * 
 * Script para gerenciar a busca e exibição de resultados
 */

import api from './api.js';
import { Utils, Toast } from './main.js';

// Estado da página
const state = {
  searchTerm: '',
  results: [],
  isLoading: false,
  currentPage: 1,
  resultsPerPage: 12,
  totalResults: 0
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('Curumim News - Página de Pesquisa inicializada');
  
  // Obter termo de pesquisa da URL
  const params = new URLSearchParams(window.location.search);
  const searchTerm = params.get('q');
  
  // Configurar a página
  setupSearchPage(searchTerm);
});

/**
 * Configura a página de pesquisa
 * @param {string} searchTerm - Termo de pesquisa
 */
function setupSearchPage(searchTerm) {
  // Atualizar termo no input
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchTerm) {
    searchInput.value = searchTerm;
  }
  
  // Exibir termo na página
  const searchTermDisplay = document.getElementById('search-term-display');
  if (searchTermDisplay) {
    searchTermDisplay.textContent = searchTerm || '';
  }
  
  // Se tiver termo de pesquisa, realizar a busca
  if (searchTerm && searchTerm.trim() !== '') {
    state.searchTerm = searchTerm.trim();
    executeSearch();
  } else {
    // Mostrar mensagem de nenhum resultado
    showNoResults();
  }
  
  // Configurar busca ao pressionar Enter
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const newTerm = searchInput.value.trim();
        if (newTerm) {
          window.location.href = `/pesquisa.html?q=${encodeURIComponent(newTerm)}`;
        }
      }
    });
  }
  
  // Configurar botão de busca
  const searchButton = document.querySelector('.search-button');
  if (searchButton) {
    searchButton.addEventListener('click', () => {
      const newTerm = searchInput ? searchInput.value.trim() : '';
      if (newTerm) {
        window.location.href = `/pesquisa.html?q=${encodeURIComponent(newTerm)}`;
      }
    });
  }
}

/**
 * Executa a busca usando a API
 */
async function executeSearch() {
  try {
    // Mostrar estado de carregamento
    toggleLoading(true);
    
    // Realizar a busca através da API
    const { success, data, error } = await api.posts.search(state.searchTerm, 50);
    
    if (!success) {
      throw new Error(error || 'Erro ao buscar resultados');
    }
    
    // Atualizar estado
    state.results = data || [];
    state.totalResults = data ? data.length : 0;
    
    // Atualizar contador de resultados
    updateResultsCount();
    
    // Exibir resultados ou mensagem de nenhum resultado
    if (state.results.length > 0) {
      renderResults();
    } else {
      showNoResults();
    }
    
  } catch (error) {
    console.error('Erro na pesquisa:', error);
    Toast.show('Erro ao realizar a pesquisa', 'error');
    showNoResults('Ocorreu um erro ao processar sua pesquisa. Tente novamente mais tarde.');
  } finally {
    // Ocultar carregamento
    toggleLoading(false);
  }
}

/**
 * Mostra ou oculta o indicador de carregamento
 * @param {boolean} show - Se deve mostrar ou ocultar
 */
function toggleLoading(show) {
  const loadingElement = document.getElementById('search-loading');
  const resultsGrid = document.getElementById('search-results');
  const noResults = document.getElementById('no-results');
  
  if (loadingElement) {
    loadingElement.style.display = show ? 'flex' : 'none';
  }
  
  if (resultsGrid) {
    resultsGrid.style.display = show ? 'none' : 'grid';
  }
  
  if (noResults) {
    noResults.style.display = 'none';
  }
  
  state.isLoading = show;
}

/**
 * Atualiza o contador de resultados
 */
function updateResultsCount() {
  const countElement = document.getElementById('search-count');
  if (!countElement) return;
  
  if (state.totalResults === 0) {
    countElement.textContent = 'Nenhum resultado encontrado';
  } else if (state.totalResults === 1) {
    countElement.textContent = '1 resultado encontrado';
  } else {
    countElement.textContent = `${state.totalResults} resultados encontrados`;
  }
}

/**
 * Renderiza os resultados da pesquisa
 */
function renderResults() {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;
  
  // Limpar container
  resultsContainer.innerHTML = '';
  
  // Para simplificar, exibimos todos os resultados de uma vez
  // Em uma aplicação real, implementaríamos paginação aqui
  state.results.forEach(article => {
    const formattedDate = Utils.formatDate(article.data_publicacao);
    
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
      <div class="news-card-image">
        <img src="${article.image_path || 'assets/img/news-placeholder.jpg'}" alt="${article.titulo}">
      </div>
      <div class="news-card-content">
        <span class="news-card-category">${article.categoria || 'Notícia'}</span>
        <h3 class="news-card-title">${article.titulo}</h3>
        <p class="news-card-date">${formattedDate}</p>
      </div>
      <a href="/noticia.html?slug=${article.slug}" class="card-link" aria-label="${article.titulo}"></a>
    `;
    
    resultsContainer.appendChild(card);
  });
  
  // Adicionar evento de clique para todos os cards
  const newsCards = resultsContainer.querySelectorAll('.news-card');
  newsCards.forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.querySelector('.card-link').getAttribute('href').split('slug=')[1];
      window.location.href = `/noticia.html?slug=${slug}`;
    });
  });
}

/**
 * Mostra a mensagem de nenhum resultado
 * @param {string} message - Mensagem opcional personalizada
 */
function showNoResults(message) {
  const noResultsElement = document.getElementById('no-results');
  const resultsGrid = document.getElementById('search-results');
  
  if (noResultsElement) {
    // Atualizar mensagem personalizada se fornecida
    if (message) {
      const messageEl = noResultsElement.querySelector('.no-results-message');
      if (messageEl) {
        messageEl.textContent = message;
      }
    }
    
    noResultsElement.style.display = 'block';
  }
  
  if (resultsGrid) {
    resultsGrid.style.display = 'none';
  }
} 