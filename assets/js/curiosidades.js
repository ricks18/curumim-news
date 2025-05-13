/**
 * Curumim News - Curiosidades
 * 
 * Gerencia funcionalidades específicas da página de curiosidades:
 * - Carregamento das curiosidades do Supabase
 * - Pesquisa e filtragem
 * - Paginação
 * - Formulário para envio de sugestões de curiosidades
 */

import api from './api.js';
import { Utils, Toast } from './main.js';

// Estado global da página
const state = {
  curiosidades: [],
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  isLoadingMore: false,
  searchTerm: '',
  filterValue: 'newest'
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log('Curumim News - Curiosidades inicializado');
  
  // Inicializar componentes
  initCuriosidades();
  setupEventListeners();
  initModal();
});

/**
 * Configura os event listeners da página
 */
function setupEventListeners() {
  // Botão de carregar mais
  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      if (!state.isLoadingMore && state.currentPage < state.totalPages) {
        state.currentPage++;
        loadMoreCuriosidades();
      }
    });
  }
  
  // Campo de pesquisa
  const searchInput = document.getElementById('search-curiosidades');
  const searchBtn = document.getElementById('search-btn');
  
  if (searchInput && searchBtn) {
    searchBtn.addEventListener('click', () => {
      state.searchTerm = searchInput.value.trim();
      state.currentPage = 1;
      loadCuriosidades(false);
    });
    
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        state.searchTerm = searchInput.value.trim();
        state.currentPage = 1;
        loadCuriosidades(false);
      }
    });
  }
  
  // Filtro de ordenação
  const filterSelect = document.getElementById('filter-date');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      state.filterValue = filterSelect.value;
      state.currentPage = 1;
      loadCuriosidades(false);
    });
  }
  
  // Botão de compartilhar curiosidade
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      openModal();
    });
  }
}

/**
 * Inicializa a carga de curiosidades
 */
function initCuriosidades() {
  const curiosidadesContainer = document.getElementById('curiosidades-container');
  if (!curiosidadesContainer) return;
  
  loadCuriosidades(false);
}

/**
 * Carrega curiosidades do Supabase
 * @param {boolean} append - Se deve anexar ou substituir o conteúdo
 */
async function loadCuriosidades(append = false) {
  try {
    // Evitar múltiplos carregamentos simultaneos
    if (state.isLoading) return;
    
    state.isLoading = true;
    showLoading(true);
    
    // Preparar parâmetros da busca
    const page = state.currentPage;
    const limit = 6;
    const order = state.filterValue === 'newest' ? 'desc' : 'asc';
    
    // Chamar API para buscar curiosidades
    let result;
    
    if (state.searchTerm) {
      result = await api.curiosidades.search(state.searchTerm, page, limit, order);
    } else {
      result = await api.curiosidades.getList(page, limit, order);
    }
    
    const { success, data, pagination, error } = result;
    
    if (!success) {
      throw new Error(error || 'Erro ao carregar curiosidades');
    }
    
    // Atualizar estado
    if (append) {
      state.curiosidades = [...state.curiosidades, ...data];
    } else {
      state.curiosidades = data;
    }
    
    state.totalPages = pagination.totalPages;
    
    // Renderizar curiosidades
    renderCuriosidades(data, append);
    
    // Atualizar botão de carregar mais
    updateLoadMoreButton();
    
  } catch (error) {
    console.error('Erro ao carregar curiosidades:', error);
    Toast.show('Erro ao carregar curiosidades', 'error');
    
    const container = document.getElementById('curiosidades-container');
    if (container && !append) {
      container.innerHTML = '<p class="error-message">Não foi possível carregar as curiosidades. Tente novamente mais tarde.</p>';
    }
  } finally {
    state.isLoading = false;
    showLoading(false);
  }
}

/**
 * Carrega mais curiosidades quando o botão "Carregar mais" é clicado
 */
function loadMoreCuriosidades() {
  if (state.isLoadingMore) return;
  
  state.isLoadingMore = true;
  
  // Alterar botão para indicar carregamento
  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    const spinner = loadMoreBtn.querySelector('.fa-spinner');
    const span = loadMoreBtn.querySelector('span');
    
    if (spinner) spinner.classList.remove('hidden');
    if (span) span.textContent = 'Carregando...';
  }
  
  // Carregar mais curiosidades
  loadCuriosidades(true)
    .finally(() => {
      state.isLoadingMore = false;
      
      // Restaurar texto do botão
      if (loadMoreBtn) {
        const spinner = loadMoreBtn.querySelector('.fa-spinner');
        const span = loadMoreBtn.querySelector('span');
        
        if (spinner) spinner.classList.add('hidden');
        if (span) span.textContent = 'Carregar mais';
      }
    });
}

/**
 * Renderiza as curiosidades na página
 * @param {Array} curiosidades - Array de objetos de curiosidades
 * @param {boolean} append - Se deve anexar ou substituir o conteúdo
 */
function renderCuriosidades(curiosidades, append = false) {
  const container = document.getElementById('curiosidades-container');
  if (!container) return;
  
  // Se não estiver anexando, limpar container
  if (!append) {
    container.innerHTML = '';
  }
  
  // Se não tiver dados para mostrar
  if (!curiosidades || curiosidades.length === 0) {
    if (!append) {
      container.innerHTML = '<p class="no-results">Nenhuma curiosidade encontrada</p>';
    }
    return;
  }
  
  // Renderizar cada curiosidade
  curiosidades.forEach(curiosidade => {
    const card = document.createElement('div');
    card.className = 'curiosity-card';
    card.setAttribute('data-id', curiosidade.id);
    
    // Verificar se esta é a curiosidade destacada (via parâmetro URL)
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get('highlight');
    
    if (highlightId && parseInt(highlightId) === curiosidade.id) {
      card.classList.add('highlighted');
      
      // Rolar para a curiosidade destacada após renderização
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
      
      // Registrar visualização para a curiosidade destacada
      api.stats.registrarVisualizacao(curiosidade.id, 'curiosidade')
        .then(() => console.log('Visualização registrada para curiosidade ID:', curiosidade.id))
        .catch(err => console.error('Erro ao registrar visualização:', err));
    }
    
    const date = new Date(curiosidade.data);
    const formattedDate = Utils.formatDate(date);
    
    card.innerHTML = `
      <div class="curiosity-icon">
        <i class="fas fa-lightbulb"></i>
      </div>
      <div class="curiosity-content">
        <p>${curiosidade.texto}</p>
      </div>
      <div class="curiosity-meta">
        <span class="date"><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
        <button class="btn-share" data-id="${curiosidade.id}" title="Compartilhar esta curiosidade">
          <i class="fas fa-share-alt"></i>
        </button>
      </div>
    `;
    
    container.appendChild(card);
    
    // Configurar evento de compartilhamento
    const shareBtn = card.querySelector('.btn-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        // Evitar que o clique propague para o card
        e.stopPropagation();
        
        // Carregar dados da curiosidade para compartilhamento
        const sharedCuriosityId = e.currentTarget.getAttribute('data-id');
        loadCuriosityForSharing(sharedCuriosityId);
      });
    }
    
    // Adicionar evento de clique no card para expandir/contrair
    card.addEventListener('click', () => {
      // Toggle da classe 'expanded'
      card.classList.toggle('expanded');
      
      // Registrar visualização ao expandir uma curiosidade
      if (card.classList.contains('expanded')) {
        const curiosidadeId = card.getAttribute('data-id');
        api.stats.registrarVisualizacao(curiosidadeId, 'curiosidade')
          .then(() => console.log('Visualização registrada para curiosidade ID:', curiosidadeId))
          .catch(err => console.error('Erro ao registrar visualização:', err));
      }
    });
  });
}

/**
 * Mostra ou esconde o indicador de carregamento
 * @param {boolean} show - Se deve mostrar ou esconder o loader
 */
function showLoading(show) {
  const loading = document.getElementById('curiosidades-loading');
  if (loading) {
    loading.style.display = show ? 'block' : 'none';
  }
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
 * Inicializa o modal de compartilhamento de curiosidades
 */
function initModal() {
  const modal = document.getElementById('curiosidade-modal');
  const closeBtn = document.querySelector('.close-modal');
  const form = document.getElementById('curiosidade-form');
  
  if (!modal || !closeBtn || !form) return;
  
  // Fechar modal ao clicar no X
  closeBtn.addEventListener('click', () => {
    closeModal();
  });
  
  // Fechar modal ao clicar fora do conteúdo
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Enviar formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Coletar dados do formulário
    const nome = document.getElementById('curiosidade-nome').value;
    const email = document.getElementById('curiosidade-email').value;
    const texto = document.getElementById('curiosidade-texto').value;
    
    // Validar comprimento
    if (texto.length > 300) {
      Toast.show('O texto deve ter no máximo 300 caracteres', 'error');
      return;
    }
    
    try {
      // Enviar para o Supabase
      const { success, error } = await api.curiosidades.submitSuggestion({
        nome,
        email,
        texto
      });
      
      if (!success) {
        throw new Error(error || 'Erro ao enviar curiosidade');
      }
      
      // Sucesso
      Toast.show('Sua curiosidade foi enviada com sucesso!', 'success');
      closeModal();
      form.reset();
      
    } catch (error) {
      console.error('Erro ao enviar curiosidade:', error);
      Toast.show('Não foi possível enviar sua curiosidade', 'error');
    }
  });
}

/**
 * Abre o modal de compartilhamento de curiosidades
 */
function openModal() {
  const modal = document.getElementById('curiosidade-modal');
  if (modal) {
    modal.style.display = 'block';
  }
}

/**
 * Fecha o modal de compartilhamento de curiosidades
 */
function closeModal() {
  const modal = document.getElementById('curiosidade-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Exportar funções para uso em outros módulos
export default {
  loadCuriosidades,
  loadMoreCuriosidades
}; 