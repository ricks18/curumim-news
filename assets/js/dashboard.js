import api from './api.js';
import { Utils, Toast, Loader, Modal } from './main.js';

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

      // Placeholder para visualizações e outros usuários, já que não temos no getDashboardStats ainda
      document.getElementById('total-views').textContent = 'N/A'; 
      document.getElementById('views-change').textContent = 'N/A';
      
      // A API de stats já busca o total de usuários (admins/editores) implicitamente pelo RLS ou poderia ser adicionado.
      // Por enquanto, vamos manter o '1' que está no HTML ou buscar o total de perfis.
      // const profiles = await api.profiles.getList(); // Supondo uma função api.profiles.getList()
      // document.getElementById('total-admins').textContent = profiles.data?.length || '1'; 
      document.getElementById('total-admins').textContent = '1'; // Mantendo o valor fixo por enquanto
      document.getElementById('admins-change').textContent = '0%';

      console.log('loadDashboardStats: Estatísticas carregadas e exibidas.');
    } else {
      console.error('loadDashboardStats: Erro ao carregar estatísticas -', error);
      Toast.show(error || 'Não foi possível carregar as estatísticas.', 'error');
      // Preencher com 'Erro' ou manter os zeros em caso de falha
      document.getElementById('total-noticias').textContent = '-';
      document.getElementById('total-curiosidades').textContent = '-';
    }
  } catch (err) {
    console.error('loadDashboardStats: Erro catastrófico ao buscar estatísticas:', err);
    Toast.show('Erro grave ao carregar dados do dashboard.', 'error');
    document.getElementById('total-noticias').textContent = '!';
    document.getElementById('total-curiosidades').textContent = '!';
  }
};

/**
 * Inicializa as funcionalidades do dashboard.
 */
const initDashboard = () => {
  console.log('initDashboard: Inicializando o dashboard...');
  loadDashboardStats();
  // Aqui chamaremos outras funções para carregar tabelas, configurar tabs, etc.
  // setupTabs();
  // loadNoticiasTable();
  // loadCuriosidadesTable();
  // setupDashboardModals(); 
  console.log('initDashboard: Dashboard inicializado.');
};

// Garante que o admin.js já tenha feito a verificação de auth
// e que o usuário esteja de fato no dashboard.
if (document.body.classList.contains('admin-dashboard')) {
    // Adia a inicialização do dashboard para o final do ciclo de eventos, 
    // garantindo que o DOM esteja totalmente pronto e main.js/admin.js tenham rodado.
    setTimeout(initDashboard, 0);
} else {
    console.log('dashboard.js: Não estamos na página do dashboard, script não será totalmente inicializado.');
} 