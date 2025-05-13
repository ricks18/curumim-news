import api from './api.js';
// Remover importação de main.js
// import { Utils, Toast, Loader, Modal } from './main.js';
// Importar ToastManager como Toast
import Toast from './modules/toastManager.js';

console.log('dashboard.js carregado');

/**
 * Carrega e exibe as estatísticas no dashboard.
 */
const loadDashboardStats = async () => {
  console.log('loadDashboardStats: Buscando estatísticas...');
  try {
    const { success, data, error } = await api.stats.getDashboardStats();
    console.log('loadDashboardStats: Resultado da busca de estatísticas:', { success, data, error });

    if (success && data) {
      document.getElementById('total-noticias').textContent = data.posts.total || '0';
      document.getElementById('noticias-change').textContent = `${data.posts.percentualCrescimento.toFixed(0)}%`;
      
      document.getElementById('total-curiosidades').textContent = data.curiosidades.total || '0';
      document.getElementById('curiosidades-change').textContent = `${data.curiosidades.percentualCrescimento.toFixed(0)}%`;

      document.getElementById('total-views').textContent = data.views.total || '0';
      document.getElementById('views-change').textContent = `${data.views.percentualCrescimento.toFixed(0)}%`;
      
      document.getElementById('total-admins').textContent = '1'; // Mantendo o valor fixo por enquanto
      document.getElementById('admins-change').textContent = '0%';

      console.log('loadDashboardStats: Estatísticas carregadas e exibidas.');
    } else {
      console.error('loadDashboardStats: Erro ao carregar estatísticas -', error);
      Toast.show(error.message || 'Não foi possível carregar as estatísticas.', 'error');
      // Preencher com 'Erro' ou manter os zeros em caso de falha
      document.getElementById('total-noticias').textContent = '-';
      document.getElementById('total-curiosidades').textContent = '-';
      document.getElementById('total-views').textContent = '-';
    }
  } catch (err) {
    console.error('loadDashboardStats: Erro catastrófico ao buscar estatísticas:', err);
    Toast.show('Erro grave ao carregar dados do dashboard.', 'error');
    document.getElementById('total-noticias').textContent = '!';
    document.getElementById('total-curiosidades').textContent = '!';
    document.getElementById('total-views').textContent = '!';
  }
};

/**
 * Configura as abas na interface do dashboard
 */
const setupTabs = () => {
  console.log('setupTabs: Configurando comportamento das abas...');
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  // Verificar se há uma aba na URL (parâmetro 'tab')
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab');
  
  // Verificar se há uma aba salva no localStorage
  const savedTab = localStorage.getItem('curuminNews_dashboardTab');
  
  // Determinar qual aba deve ser ativada (prioridade: URL > localStorage > padrão)
  let activeTabId = 'noticias-tab'; // Tab padrão
  
  if (tabFromUrl) {
    activeTabId = tabFromUrl;
  } else if (savedTab) {
    activeTabId = savedTab;
  }
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Remove a classe active de todos os botões e painéis
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
      
      // Adiciona a classe active ao botão e painel selecionados
      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
      
      // Salva a aba atual no localStorage
      localStorage.setItem('curuminNews_dashboardTab', targetTab);
      
      // Atualiza a URL sem recarregar a página
      const url = new URL(window.location);
      url.searchParams.set('tab', targetTab);
      window.history.pushState({}, '', url);
      
      // Carrega dados específicos para a aba selecionada
      if (targetTab === 'noticias-tab') {
        loadNewsTable();
      } else if (targetTab === 'curiosidades-tab') {
        loadCuriositiesTable();
      }
    });
  });
  
  // Também configura os links da sidebar que apontam para as abas
  const sidebarTabLinks = document.querySelectorAll('.admin-nav a[data-tab]');
  sidebarTabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.dataset.tab;
      
      // Simula o clique no botão da aba correspondente
      document.querySelector(`.tab-btn[data-tab="${targetTab}"]`).click();
    });
  });
  
  // Ativa a aba determinada (URL, localStorage ou padrão)
  const tabToActivate = document.querySelector(`.tab-btn[data-tab="${activeTabId}"]`);
  if (tabToActivate) {
    tabToActivate.click();
  } else {
    // Fallback para a primeira aba se a aba determinada não existir
    const firstTab = document.querySelector('.tab-btn');
    if (firstTab) firstTab.click();
  }
  
  console.log('setupTabs: Abas configuradas com sucesso.');
};

/**
 * Renderiza os controles de paginação para uma tabela
 * @param {string} containerId - ID do elemento container da paginação (ex: 'noticias-pagination')
 * @param {object} paginationData - Objeto com dados da paginação ({ page, limit, total, totalPages })
 * @param {Function} loadFunction - Função a ser chamada ao clicar em um botão de página (ex: loadNewsTable)
 */
const renderPaginationControls = (containerId, paginationData, loadFunction) => {
  const { page, totalPages } = paginationData;
  const paginationContainer = document.getElementById(containerId);

  if (!paginationContainer || totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  paginationContainer.innerHTML = ''; // Limpa controles anteriores

  const ul = document.createElement('ul');
  ul.className = 'pagination';

  // Botão Anterior
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${page === 1 ? 'disabled' : ''}`;
  const prevLink = document.createElement('a');
  prevLink.className = 'page-link';
  prevLink.href = '#';
  prevLink.textContent = 'Anterior';
  prevLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (page > 1) {
      loadFunction(page - 1);
    }
  });
  prevLi.appendChild(prevLink);
  ul.appendChild(prevLi);

  // Lógica para exibir números de página (simplificada por enquanto)
  // Idealmente, adicionar lógica para "..." se houver muitas páginas
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page-item ${i === page ? 'active' : ''}`;
    const pageLink = document.createElement('a');
    pageLink.className = 'page-link';
    pageLink.href = '#';
    pageLink.textContent = i;
    pageLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (i !== page) {
        loadFunction(i);
      }
    });
    pageLi.appendChild(pageLink);
    ul.appendChild(pageLi);
  }

  // Botão Próximo
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
  const nextLink = document.createElement('a');
  nextLink.className = 'page-link';
  nextLink.href = '#';
  nextLink.textContent = 'Próximo';
  nextLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (page < totalPages) {
      loadFunction(page + 1);
    }
  });
  nextLi.appendChild(nextLink);
  ul.appendChild(nextLi);

  paginationContainer.appendChild(ul);
};

/**
 * Carrega a tabela de notícias
 * @param {number} page - Número da página a carregar
 * @param {number} limit - Número de itens por página
 */
const loadNewsTable = async (page = 1, limit = 10) => {
  console.log(`loadNewsTable: Carregando página ${page} da tabela de notícias...`);
  const tableBody = document.querySelector('#noticias-table tbody');
  if (!tableBody) {
    console.error('loadNewsTable: Elemento tbody da tabela de notícias não encontrado');
    return;
  }
  
  // Exibe loader
  tableBody.innerHTML = '<tr><td colspan="6" class="loading-row"><div class="loader"></div></td></tr>';
  
  try {
    const { success, data, pagination, error } = await api.posts.getList(page, limit);
    
    if (success && data) {
      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-row">Nenhuma notícia encontrada</td></tr>';
        return;
      }
      
      tableBody.innerHTML = '';
      
      data.forEach(post => {
        const createdAt = new Date(post.created_at).toLocaleDateString('pt-BR');
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>
            <div class="table-img">
              ${post.image_path ? `<img src="${post.image_path}" alt="${post.titulo}" />` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
            </div>
          </td>
          <td>${post.titulo}</td>
          <td>${post.autor || 'Admin'}</td>
          <td>${createdAt}</td>
          <td>${post.status || 'Publicado'}</td>
          <td>
            <div class="action-buttons">
              <a href="/admin/editor.html?mode=edit&type=post&id=${post.id}" class="btn-edit" title="Editar">
                <i class="fas fa-edit"></i>
              </a>
              <button class="btn-delete" data-id="${post.id}" data-type="post" title="Excluir">
                <i class="fas fa-trash"></i>
              </button>
              <a href="/noticia.html?id=${post.id}" class="btn-view" target="_blank" title="Visualizar">
                <i class="fas fa-eye"></i>
              </a>
            </div>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Configura os botões de exclusão
      const deleteButtons = tableBody.querySelectorAll('.btn-delete');
      deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteItem);
      });
      
      // Renderiza a paginação
      renderPaginationControls('noticias-pagination', pagination, loadNewsTable);
      
    } else {
      console.error('loadNewsTable: Erro ao carregar notícias -', error);
      tableBody.innerHTML = `<tr><td colspan="6" class="error-row">Erro ao carregar notícias: ${error || 'Erro desconhecido'}</td></tr>`;
    }
  } catch (err) {
    console.error('loadNewsTable: Erro catastrófico ao buscar notícias:', err);
    tableBody.innerHTML = '<tr><td colspan="6" class="error-row">Erro grave ao carregar notícias</td></tr>';
  }
  
  console.log('loadNewsTable: Tabela de notícias carregada.');
};

/**
 * Carrega a tabela de curiosidades
 * @param {number} page - Número da página a carregar
 * @param {number} limit - Número de itens por página
 */
const loadCuriositiesTable = async (page = 1, limit = 10) => {
  console.log(`loadCuriositiesTable: Carregando página ${page} da tabela de curiosidades...`);
  const tableBody = document.querySelector('#curiosidades-table tbody');
  if (!tableBody) {
    console.error('loadCuriositiesTable: Elemento tbody da tabela de curiosidades não encontrado');
    return;
  }
  
  // Exibe loader
  tableBody.innerHTML = '<tr><td colspan="5" class="loading-row"><div class="loader"></div></td></tr>';
  
  try {
    const { success, data, pagination, error } = await api.curiosidades.getList(page, limit);
    
    if (success && data) {
      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-row">Nenhuma curiosidade encontrada</td></tr>';
        return;
      }
      
      tableBody.innerHTML = '';
      
      data.forEach(curiosidade => {
        const createdAt = new Date(curiosidade.created_at).toLocaleDateString('pt-BR');
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${curiosidade.texto.substring(0, 100)}${curiosidade.texto.length > 100 ? '...' : ''}</td>
          <td>${curiosidade.autor || 'Admin'}</td>
          <td>${createdAt}</td>
          <td>${curiosidade.status || 'Publicado'}</td>
          <td>
            <div class="action-buttons">
              <a href="/admin/editor.html?mode=edit&type=curiosidade&id=${curiosidade.id}" class="btn-edit" title="Editar">
                <i class="fas fa-edit"></i>
              </a>
              <button class="btn-delete" data-id="${curiosidade.id}" data-type="curiosidade" title="Excluir">
                <i class="fas fa-trash"></i>
              </button>
              <a href="/curiosidades.html?highlight=${curiosidade.id}" class="btn-view" target="_blank" title="Visualizar">
                <i class="fas fa-eye"></i>
              </a>
            </div>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Configura os botões de exclusão
      const deleteButtons = tableBody.querySelectorAll('.btn-delete');
      deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteItem);
      });
      
      // Renderiza a paginação
      renderPaginationControls('curiosidades-pagination', pagination, loadCuriositiesTable);
      
    } else {
      console.error('loadCuriositiesTable: Erro ao carregar curiosidades -', error);
      tableBody.innerHTML = `<tr><td colspan="5" class="error-row">Erro ao carregar curiosidades: ${error || 'Erro desconhecido'}</td></tr>`;
    }
  } catch (err) {
    console.error('loadCuriositiesTable: Erro catastrófico ao buscar curiosidades:', err);
    tableBody.innerHTML = '<tr><td colspan="5" class="error-row">Erro grave ao carregar curiosidades</td></tr>';
  }
  
  console.log('loadCuriositiesTable: Tabela de curiosidades carregada.');
};

/**
 * Manipula a exclusão de itens (notícias ou curiosidades)
 */
const handleDeleteItem = async (e) => {
  const button = e.currentTarget;
  const itemId = button.dataset.id;
  const itemType = button.dataset.type;
  const itemName = itemType === 'post' ? 'notícia' : 'curiosidade';
  
  console.log(`handleDeleteItem: Solicitação para excluir ${itemName} com ID ${itemId}`);
  
  // Obter informações do item para o modal
  let itemInfo = null;
  
  try {
    if (itemType === 'post') {
      const { data } = await api.posts.getById(itemId);
      itemInfo = data;
    } else {
      const { data } = await api.curiosidades.getById(itemId);
      itemInfo = data;
    }
  } catch (err) {
    console.error(`Erro ao obter informações do item para exclusão:`, err);
  }
  
  // Mostrar modal de confirmação
  const deleteModal = document.getElementById('delete-modal');
  const deleteItemInfo = document.getElementById('delete-item-info');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const cancelDeleteBtn = document.getElementById('cancel-delete');
  const closeModalBtn = deleteModal.querySelector('.close-modal');
  
  if (deleteModal && Modal) {
    // Preencher informações do item, se disponíveis
    if (deleteItemInfo && itemInfo) {
      if (itemType === 'post') {
        deleteItemInfo.innerHTML = `
          <h3>${itemInfo.titulo}</h3>
          <p><strong>Data:</strong> ${new Date(itemInfo.created_at || itemInfo.data_publicacao).toLocaleDateString('pt-BR')}</p>
        `;
      } else {
        deleteItemInfo.innerHTML = `
          <p>${itemInfo.texto.substring(0, 100)}${itemInfo.texto.length > 100 ? '...' : ''}</p>
          <p><strong>Data:</strong> ${new Date(itemInfo.created_at || itemInfo.data).toLocaleDateString('pt-BR')}</p>
        `;
      }
    } else if (deleteItemInfo) {
      deleteItemInfo.innerHTML = `<p>Item ID: ${itemId}</p>`;
    }
    
    // Abrir o modal
    Modal.open('delete-modal');
    
    // Configurar botões do modal
    const handleConfirm = async () => {
      // Remover event listeners temporários antes de processar
      confirmDeleteBtn.removeEventListener('click', handleConfirm);
      cancelDeleteBtn.removeEventListener('click', handleCancel);
      closeModalBtn.removeEventListener('click', handleCancel);
      
      try {
        let result;
        
        if (itemType === 'post') {
          result = await api.posts.delete(itemId);
        } else if (itemType === 'curiosidade') {
          result = await api.curiosidades.delete(itemId);
        }
        
        if (result.success) {
          Toast.show(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} excluída com sucesso!`, 'success');
          
          // Recarrega a tabela correspondente
          if (itemType === 'post') {
            loadNewsTable();
          } else if (itemType === 'curiosidade') {
            loadCuriositiesTable();
          }
          
          // Atualiza as estatísticas
          loadDashboardStats();
        } else {
          Toast.show(`Erro ao excluir ${itemName}: ${result.error || 'Erro desconhecido'}`, 'error');
        }
      } catch (err) {
        console.error(`handleDeleteItem: Erro ao excluir ${itemName}:`, err);
        Toast.show(`Erro grave ao excluir ${itemName}`, 'error');
      }
      
      // Fechar o modal
      Modal.close('delete-modal');
    };
    
    const handleCancel = () => {
      // Remover event listeners temporários ao cancelar
      confirmDeleteBtn.removeEventListener('click', handleConfirm);
      cancelDeleteBtn.removeEventListener('click', handleCancel);
      closeModalBtn.removeEventListener('click', handleCancel);
      
      Modal.close('delete-modal');
    };
    
    // Adicionar event listeners temporários
    confirmDeleteBtn.addEventListener('click', handleConfirm);
    cancelDeleteBtn.addEventListener('click', handleCancel);
    closeModalBtn.addEventListener('click', handleCancel);
    
  } else {
    // Fallback para browsers sem suporte a modal ou se o modal não estiver disponível
    if (confirm(`Tem certeza que deseja excluir esta ${itemName}? Esta ação não poderá ser desfeita.`)) {
      try {
        let result;
        
        if (itemType === 'post') {
          result = await api.posts.delete(itemId);
        } else if (itemType === 'curiosidade') {
          result = await api.curiosidades.delete(itemId);
        }
        
        if (result.success) {
          Toast.show(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} excluída com sucesso!`, 'success');
          
          // Recarrega a tabela correspondente
          if (itemType === 'post') {
            loadNewsTable();
          } else if (itemType === 'curiosidade') {
            loadCuriositiesTable();
          }
          
          // Atualiza as estatísticas
          loadDashboardStats();
        } else {
          Toast.show(`Erro ao excluir ${itemName}: ${result.error || 'Erro desconhecido'}`, 'error');
        }
      } catch (err) {
        console.error(`handleDeleteItem: Erro ao excluir ${itemName}:`, err);
        Toast.show(`Erro grave ao excluir ${itemName}`, 'error');
      }
    }
  }
};

/**
 * Busca notícias conforme o termo informado
 * @param {string} query - Termo de busca
 */
const searchNoticias = async (query) => {
  console.log(`searchNoticias: Buscando notícias com o termo "${query}"...`);
  const tableBody = document.querySelector('#noticias-table tbody');
  const paginationContainer = document.getElementById('noticias-pagination');
  if (!tableBody) {
    console.error('searchNoticias: Elemento tbody da tabela de notícias não encontrado');
    return;
  }
  
  // Exibe loader
  tableBody.innerHTML = '<tr><td colspan="6" class="loading-row"><div class="loader"></div></td></tr>';
  if (paginationContainer) paginationContainer.innerHTML = ''; // Limpa paginação durante busca
  
  try {
    const { success, data, error } = await api.posts.search(query);
    
    if (success && data) {
      if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Nenhuma notícia encontrada para "${query}"</td></tr>`;
        return;
      }
      
      tableBody.innerHTML = '';
      
      data.forEach(post => {
        const createdAt = new Date(post.created_at).toLocaleDateString('pt-BR');
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>
            <div class="table-img">
              ${post.image_path ? `<img src="${post.image_path}" alt="${post.titulo}" />` : '<div class="no-image"><i class="fas fa-image"></i></div>'}
            </div>
          </td>
          <td>${post.titulo}</td>
          <td>${post.autor || 'Admin'}</td>
          <td>${createdAt}</td>
          <td>${post.status || 'Publicado'}</td>
          <td>
            <div class="action-buttons">
              <a href="/admin/editor.html?mode=edit&type=post&id=${post.id}" class="btn-edit" title="Editar">
                <i class="fas fa-edit"></i>
              </a>
              <button class="btn-delete" data-id="${post.id}" data-type="post" title="Excluir">
                <i class="fas fa-trash"></i>
              </button>
              <a href="/noticia.html?id=${post.id}" class="btn-view" target="_blank" title="Visualizar">
                <i class="fas fa-eye"></i>
              </a>
            </div>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Exibe mensagem de resultados da busca
      const searchResults = document.createElement('tr');
      searchResults.innerHTML = `<td colspan="6" class="search-results">Resultados da busca por "${query}": ${data.length} notícia(s) encontrada(s) <button id="clear-search-noticias" class="btn-clear-search">Limpar busca</button></td>`;
      tableBody.insertBefore(searchResults, tableBody.firstChild);
      
      // Configura botão de limpar busca
      document.getElementById('clear-search-noticias').addEventListener('click', () => {
        document.getElementById('search-noticias').value = '';
        loadNewsTable(1); // Volta para a página 1 ao limpar busca
      });
      
      // Configura os botões de exclusão
      const deleteButtons = tableBody.querySelectorAll('.btn-delete');
      deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteItem);
      });
      
    } else {
      console.error('searchNoticias: Erro ao buscar notícias -', error);
      tableBody.innerHTML = `<tr><td colspan="6" class="error-row">Erro ao buscar notícias: ${error || 'Erro desconhecido'}</td></tr>`;
    }
  } catch (err) {
    console.error('searchNoticias: Erro catastrófico na busca de notícias:', err);
    tableBody.innerHTML = '<tr><td colspan="6" class="error-row">Erro grave ao buscar notícias</td></tr>';
  }
  
  console.log(`searchNoticias: Busca por "${query}" concluída.`);
};

/**
 * Busca curiosidades conforme o termo informado
 * @param {string} query - Termo de busca
 */
const searchCuriosidades = async (query) => {
  console.log(`searchCuriosidades: Buscando curiosidades com o termo "${query}"...`);
  const tableBody = document.querySelector('#curiosidades-table tbody');
  const paginationContainer = document.getElementById('curiosidades-pagination');
  if (!tableBody) {
    console.error('searchCuriosidades: Elemento tbody da tabela de curiosidades não encontrado');
    return;
  }
  
  // Exibe loader
  tableBody.innerHTML = '<tr><td colspan="5" class="loading-row"><div class="loader"></div></td></tr>';
  if (paginationContainer) paginationContainer.innerHTML = ''; // Limpa paginação durante busca
  
  try {
    const { success, data, error } = await api.curiosidades.search(query);
    
    if (success && data) {
      if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Nenhuma curiosidade encontrada para "${query}"</td></tr>`;
        return;
      }
      
      tableBody.innerHTML = '';
      
      data.forEach(curiosidade => {
        const createdAt = new Date(curiosidade.created_at).toLocaleDateString('pt-BR');
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${curiosidade.texto.substring(0, 100)}${curiosidade.texto.length > 100 ? '...' : ''}</td>
          <td>${curiosidade.autor || 'Admin'}</td>
          <td>${createdAt}</td>
          <td>${curiosidade.status || 'Publicado'}</td>
          <td>
            <div class="action-buttons">
              <a href="/admin/editor.html?mode=edit&type=curiosidade&id=${curiosidade.id}" class="btn-edit" title="Editar">
                <i class="fas fa-edit"></i>
              </a>
              <button class="btn-delete" data-id="${curiosidade.id}" data-type="curiosidade" title="Excluir">
                <i class="fas fa-trash"></i>
              </button>
              <a href="/curiosidades.html?highlight=${curiosidade.id}" class="btn-view" target="_blank" title="Visualizar">
                <i class="fas fa-eye"></i>
              </a>
            </div>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      // Exibe mensagem de resultados da busca
      const searchResults = document.createElement('tr');
      searchResults.innerHTML = `<td colspan="5" class="search-results">Resultados da busca por "${query}": ${data.length} curiosidade(s) encontrada(s) <button id="clear-search-curiosidades" class="btn-clear-search">Limpar busca</button></td>`;
      tableBody.insertBefore(searchResults, tableBody.firstChild);
      
      // Configura botão de limpar busca
      document.getElementById('clear-search-curiosidades').addEventListener('click', () => {
        document.getElementById('search-curiosidades').value = '';
        loadCuriositiesTable(1); // Volta para a página 1 ao limpar busca
      });
      
      // Configura os botões de exclusão
      const deleteButtons = tableBody.querySelectorAll('.btn-delete');
      deleteButtons.forEach(button => {
        button.addEventListener('click', handleDeleteItem);
      });
      
    } else {
      console.error('searchCuriosidades: Erro ao buscar curiosidades -', error);
      tableBody.innerHTML = `<tr><td colspan="5" class="error-row">Erro ao buscar curiosidades: ${error || 'Erro desconhecido'}</td></tr>`;
    }
  } catch (err) {
    console.error('searchCuriosidades: Erro catastrófico na busca de curiosidades:', err);
    tableBody.innerHTML = '<tr><td colspan="5" class="error-row">Erro grave ao buscar curiosidades</td></tr>';
  }
  
  console.log(`searchCuriosidades: Busca por "${query}" concluída.`);
};

/**
 * Inicializa as funcionalidades do dashboard.
 */
const initDashboard = () => {
  console.log('initDashboard: Inicializando o dashboard...');
  loadDashboardStats();
  setupTabs();
  // loadNewsTable(); // Carrega a tabela de notícias por padrão (primeira aba)
  // Nota: setupTabs agora chama a função de carregamento da aba ativa, então não precisamos chamar aqui explicitamente
  
  // Configura os eventos de busca
  const searchNoticiasBtn = document.getElementById('search-noticias-btn');
  const searchNoticiasInput = document.getElementById('search-noticias');
  const searchCuriosidadesBtn = document.getElementById('search-curiosidades-btn');
  const searchCuriosidadesInput = document.getElementById('search-curiosidades');
  
  if (searchNoticiasBtn && searchNoticiasInput) {
    searchNoticiasBtn.addEventListener('click', () => {
      const query = searchNoticiasInput.value.trim();
      if (query) {
        searchNoticias(query);
      } else {
        loadNewsTable(1); // Carrega todas se a busca estiver vazia
      }
    });
    
    searchNoticiasInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchNoticiasBtn.click();
      }
    });
  }
  
  if (searchCuriosidadesBtn && searchCuriosidadesInput) {
    searchCuriosidadesBtn.addEventListener('click', () => {
      const query = searchCuriosidadesInput.value.trim();
      if (query) {
        searchCuriosidades(query);
      } else {
        loadCuriositiesTable(1); // Carrega todas se a busca estiver vazia
      }
    });
    
    searchCuriosidadesInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchCuriosidadesBtn.click();
      }
    });
  }
  
  console.log('initDashboard: Dashboard inicializado.');
};

// Garante que o admin.js já tenha feito a verificação de auth
// e que o usuário esteja de fato no dashboard.
if (document.body.classList.contains('admin-dashboard')) {
    // Verificamos se os componentes principais do app já foram inicializados
    const waitForComponents = () => {
        // Verifica se Modal e Toast estão disponíveis
        if (typeof Modal === 'undefined' || typeof Toast === 'undefined') {
            // Espera 100ms e tenta novamente
            console.log('dashboard.js: Aguardando inicialização dos componentes...');
            setTimeout(waitForComponents, 100);
            return;
        }
        
        console.log('dashboard.js: Componentes disponíveis, inicializando dashboard...');
        // Inicia o dashboard quando os componentes estiverem disponíveis
        initDashboard();
    };
    
    // Inicia o processo de espera por componentes
    setTimeout(waitForComponents, 0);
} else {
    console.log('dashboard.js: Não estamos na página do dashboard, script não será totalmente inicializado.');
} 