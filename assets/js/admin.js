import api from './api.js';
// Remover importações de main.js se forem modulares ou definidas aqui
// import { Utils, Toast, Modal, Loader } from './main.js'; 
import { Utils } from './main.js'; // Corrigido para importar de main.js
import Toast from './modules/toastManager.js'; // Manter esta (corrigido de ToastManager)

console.log('admin.js carregado');

/**
 * Verifica o status de autenticação do usuário.
 * Redireciona para a página de login se não estiver autenticado,
 * a menos que já esteja na página de login.
 */
const checkAuthStatus = async () => {
  console.log('checkAuthStatus: Verificando status de autenticação...');
  const user = await api.auth.getCurrentUser();
  console.log('checkAuthStatus: Usuário atual:', user);

  const publicPages = ['/admin/login.html'];
  const currentPage = window.location.pathname;

  if (!user && !publicPages.includes(currentPage)) {
    console.log('checkAuthStatus: Usuário não autenticado e não está em página pública. Redirecionando para login.');
    window.location.href = '/admin/login.html';
    return null; // Interrompe execução adicional se redirecionado
  } else if (user && currentPage === '/admin/login.html') {
    console.log('checkAuthStatus: Usuário autenticado e na página de login. Redirecionando para dashboard.');
    window.location.href = '/admin/dashboard.html';
    return user; // Retorna usuário, mas já redirecionou
  }
  console.log('checkAuthStatus: Status de autenticação verificado.');
  return user; // Retorna o usuário para outras funções usarem
};

/**
 * Manipula o formulário de login.
 */
const handleLoginForm = () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) {
    console.log('handleLoginForm: Formulário de login não encontrado.');
    return;
  }
  console.log('handleLoginForm: Formulário de login encontrado. Adicionando listener.');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('handleLoginForm: Submit do formulário de login capturado.');

    const email = loginForm.email.value;
    const password = loginForm.password.value;
    const loginMessage = document.getElementById('login-message');
    const loginSpinner = document.getElementById('login-spinner');
    const loginButton = loginForm.querySelector('button[type="submit"]');

    // Mostrar spinner e desabilitar botão
    if(loginSpinner) loginSpinner.classList.remove('hidden');
    if(loginButton) loginButton.disabled = true;
    if(loginMessage) loginMessage.textContent = ''; loginMessage.className = 'login-message';


    console.log(`handleLoginForm: Tentando login com email: ${email}`);

    try {
      const { success, data, error } = await api.auth.login(email, password);
      console.log('handleLoginForm: Resultado do login:', { success, data, error });

      if (success && data.user) {
        console.log('handleLoginForm: Login bem-sucedido. Redirecionando para o dashboard.');
        Toast.show('Login realizado com sucesso!', 'success');
        window.location.href = '/admin/dashboard.html'; // Caminho absoluto para o dashboard
      } else {
        console.error('handleLoginForm: Falha no login -', error);
        if(loginMessage) {
            loginMessage.textContent = error || 'E-mail ou senha inválidos.';
            loginMessage.classList.add('error');
        }
        Toast.show(error || 'E-mail ou senha inválidos.', 'error');
      }
    } catch (err) {
      console.error('handleLoginForm: Erro catastrófico durante o login:', err);
      if(loginMessage) {
        loginMessage.textContent = 'Ocorreu um erro inesperado. Tente novamente.';
        loginMessage.classList.add('error');
      }
      Toast.show('Ocorreu um erro inesperado. Tente novamente.', 'error');
    } finally {
        if(loginSpinner) loginSpinner.classList.add('hidden');
        if(loginButton) loginButton.disabled = false;
        console.log('handleLoginForm: Processo de login finalizado.');
    }
  });
};

/**
 * Manipula o botão "Esqueceu a senha".
 */
const handleForgotPassword = () => {
  const forgotPasswordLink = document.getElementById('forgot-password');
  const recoverPasswordModal = document.getElementById('recover-password-modal'); // Certifique-se que este é o ID do seu modal
  const recoverForm = document.getElementById('recover-form');

  if (forgotPasswordLink && recoverPasswordModal && Modal) { // Verifica se Modal está disponível
    console.log('handleForgotPassword: Links e modal de recuperação encontrados.');
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('handleForgotPassword: Link "Esqueceu a senha" clicado.');
      Modal.open('recover-password-modal');
    });

    if (recoverForm) {
      recoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('recover-email').value;
        console.log(`handleForgotPassword: Tentando recuperar senha para: ${email}`);
        Toast.show('Processando sua solicitação...', 'info');

        const { success, error } = await api.auth.recoverPassword(email);
        if (success) {
          console.log('handleForgotPassword: Email de recuperação enviado.');
          Toast.show('Se o e-mail existir em nossa base, você receberá instruções para redefinir a senha.', 'success');
          Modal.close('recover-password-modal');
        } else {
          console.error('handleForgotPassword: Falha ao enviar email de recuperação -', error);
          Toast.show(error || 'Não foi possível processar sua solicitação.', 'error');
        }
      });
    }
  } else {
    console.log('handleForgotPassword: Elementos para recuperação de senha não encontrados ou Modal não está definido.');
  }
};

/**
 * Manipula o botão de mostrar/ocultar senha.
 */
const handleTogglePassword = () => {
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const passwordInput = button.previousElementSibling; // O input de senha
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                button.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                button.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
};

/**
 * Controla o toggle do menu lateral
 */
const handleSidebarToggle = () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const adminWrapper = document.querySelector('.admin-wrapper');
  const adminSidebar = document.querySelector('.admin-sidebar');
  const adminOverlay = document.querySelector('.admin-overlay');
  
  // Cria o overlay se não existir
  if (!adminOverlay && adminWrapper) {
    const overlay = document.createElement('div');
    overlay.className = 'admin-overlay';
    adminWrapper.appendChild(overlay);
  }
  
  // Toggle via botão do header (em telas menores)
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      console.log('Toggling sidebar visibility');
      const overlay = document.querySelector('.admin-overlay');
      
      if (adminSidebar) {
        adminSidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
      }
    });
  }
  
  // Toggle de colapso via botão da sidebar
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      console.log('Toggling sidebar collapsed state');
      document.body.classList.toggle('sidebar-collapsed');
    });
  }
  
  // Fechar sidebar ao clicar no overlay
  document.addEventListener('click', (e) => {
    const overlay = document.querySelector('.admin-overlay');
    if (e.target.classList.contains('admin-overlay') && adminSidebar) {
      adminSidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
  
  // Ajusta sidebar baseado no tamanho da tela
  const handleResize = () => {
    if (window.innerWidth <= 991) {
      document.body.classList.remove('sidebar-collapsed');
    }
  };
  
  window.addEventListener('resize', handleResize);
  handleResize(); // Executar ao carregar
};

/**
 * Controla as abas na dashboard
 */
const handleTabs = () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  // Botões da UI para trocar abas
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Atualiza botões
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Atualiza painéis
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === targetTab) {
          panel.classList.add('active');
        }
      });
    });
  });
  
  // Links do menu que acionam abas específicas
  const tabLinks = document.querySelectorAll('a[data-tab]');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.dataset.tab;
      
      // Ativa o botão da aba correspondente
      const targetButton = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
      if (targetButton) {
        targetButton.click();
      }
      
      // Se estamos em dispositivo móvel, fecha o menu
      if (window.innerWidth <= 991) {
        const adminSidebar = document.querySelector('.admin-sidebar');
        const adminOverlay = document.querySelector('.admin-overlay');
        if (adminSidebar) adminSidebar.classList.remove('active');
        if (adminOverlay) adminOverlay.classList.remove('active');
      }
    });
  });
};

/**
 * Controla os submenus na navegação lateral
 */
const handleSubmenus = () => {
  const submenuToggles = document.querySelectorAll('.submenu-toggle');
  
  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = toggle.dataset.target;
      const submenu = document.getElementById(targetId);
      
      // Fecha outros submenus
      const allSubmenus = document.querySelectorAll('.submenu');
      const allToggles = document.querySelectorAll('.submenu-toggle');
      
      allSubmenus.forEach(menu => {
        if (menu.id !== targetId) {
          menu.classList.remove('open');
        }
      });
      
      allToggles.forEach(btn => {
        if (btn !== toggle) {
          btn.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Toggle do submenu atual
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      
      if (submenu) {
        submenu.classList.toggle('open');
      }
    });
  });
};

/**
 * Gerencia o tema claro/escuro
 */
const handleThemeToggle = () => {
  const themeToggle = document.querySelector('.theme-toggle');
  
  if (themeToggle) {
    // Verifica preferência salva ou sistema
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Aplica tema salvo ou preferência do sistema
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Toggle do tema
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      // Atualiza ícone
      themeToggle.innerHTML = newTheme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
    });
  }
};

/**
 * Inicializa os componentes da interface administrativa
 */
const initAdminUIComponents = () => {
  console.log('Inicializando componentes de UI administrativa');
  handleSidebarToggle();
  handleTabs(); // Adicionado para garantir que as abas funcionem em todas as páginas admin
  handleSubmenus(); // Adicionado para garantir que os submenus funcionem
  handleThemeToggle();
  handleConfigButton(); // Adicionado para o botão de configurações
  handleTogglePassword(); // Para mostrar/ocultar senha nos formulários de login/reset
  // Não chamar initQuillEditor, initCharCounters, etc. aqui, pois pertencem ao editor.js
  console.log('Componentes de UI comuns do admin inicializados.');
};

/**
 * Inicializa o formulário de edição e seus manipuladores
 */
const initEditorForm = () => {
  const form = document.getElementById('editor-form');
  
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar o formulário
    if (!validateEditorForm()) {
      return;
    }
    
    // Coletar dados do formulário
    const formData = collectFormData();
    
    // Mostrar loader
    Loader.show('Salvando...');
    
    try {
      let result;
      
      if (editorMode === 'create') {
        // Criar novo item
        if (editorType === 'post') {
          result = await api.posts.create(formData);
        } else {
          result = await api.curiosidades.create(formData);
        }
        
        if (!result.success) {
          throw new Error(`Erro ao criar ${editorType === 'post' ? 'notícia' : 'curiosidade'}: ${result.error}`);
        }
        
        Toast.show(`${editorType === 'post' ? 'Notícia' : 'Curiosidade'} criada com sucesso!`, 'success');
      } else {
        // Atualizar item existente
        if (editorType === 'post') {
          result = await api.posts.update(editorId, formData);
        } else {
          result = await api.curiosidades.update(editorId, formData);
        }
        
        if (!result.success) {
          throw new Error(`Erro ao atualizar ${editorType === 'post' ? 'notícia' : 'curiosidade'}: ${result.error}`);
        }
        
        Toast.show(`${editorType === 'post' ? 'Notícia' : 'Curiosidade'} atualizada com sucesso!`, 'success');
      }
      
      // Redirecionar para o dashboard após sucesso
      setTimeout(() => {
        window.location.href = `/admin/dashboard.html?tab=${editorType === 'post' ? 'noticias' : 'curiosidades'}-tab`;
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      Toast.show(`Erro ao salvar conteúdo: ${error.message}`, 'error');
    } finally {
      Loader.hide();
    }
  });
  
  // Adicionar listener para botão de cancelar
  const cancelBtn = document.getElementById('btn-cancelar');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Confirmar antes de sair sem salvar
      if (formHasChanges()) {
        const confirmation = confirm('Você tem alterações não salvas. Deseja realmente sair?');
        if (!confirmation) {
          return;
        }
      }
      
      // Redirecionar para o dashboard
      window.location.href = `/admin/dashboard.html?tab=${editorType === 'post' ? 'noticias' : 'curiosidades'}-tab`;
    });
  }
};

/**
 * Verifica se o formulário foi modificado desde o carregamento
 * @returns {boolean} Verdadeiro se houver mudanças
 */
const formHasChanges = () => {
  // Implementação básica, pode ser melhorada para comparar
  // com os valores originais carregados do banco
  return true;
};

/**
 * Valida os campos do formulário antes do envio
 * @returns {boolean} Verdadeiro se o formulário estiver válido
 */
const validateEditorForm = () => {
  let isValid = true;
  
  if (editorType === 'post') {
    // Validar campos de post
    const title = document.getElementById('post-title').value.trim();
    const slug = document.getElementById('post-slug').value.trim();
    const resumo = document.getElementById('post-resumo').value.trim();
    const data = document.getElementById('post-data').value;
    const corpo = document.getElementById('post-corpo').value.trim();
    
    if (!title) {
      Toast.show('O título da notícia é obrigatório.', 'error');
      isValid = false;
    }
    
    if (!slug) {
      Toast.show('O slug da notícia é obrigatório.', 'error');
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      Toast.show('O slug deve conter apenas letras minúsculas, números e hífens.', 'error');
      isValid = false;
    }
    
    if (!resumo) {
      Toast.show('O resumo da notícia é obrigatório.', 'error');
      isValid = false;
    } else if (resumo.length > 200) {
      Toast.show('O resumo deve ter no máximo 200 caracteres.', 'error');
      isValid = false;
    }
    
    if (!data) {
      Toast.show('A data de publicação é obrigatória.', 'error');
      isValid = false;
    }
    
    if (!corpo || corpo === '<p><br></p>') {
      Toast.show('O conteúdo da notícia é obrigatório.', 'error');
      isValid = false;
    }
  } else {
    // Validar campos de curiosidade
    const texto = document.getElementById('curiosidade-texto').value.trim();
    const data = document.getElementById('curiosidade-data').value;
    
    if (!texto) {
      Toast.show('O texto da curiosidade é obrigatório.', 'error');
      isValid = false;
    }
    
    if (!data) {
      Toast.show('A data da curiosidade é obrigatória.', 'error');
      isValid = false;
    }
  }
  
  return isValid;
};

/**
 * Coleta os dados do formulário para envio
 * @returns {Object} Objeto com os dados do formulário
 */
const collectFormData = () => {
  const formData = {};
  
  if (editorType === 'post') {
    // Coletar dados de post
    formData.titulo = document.getElementById('post-title').value.trim();
    formData.slug = document.getElementById('post-slug').value.trim();
    formData.resumo = document.getElementById('post-resumo').value.trim();
    formData.data_publicacao = document.getElementById('post-data').value;
    formData.status = document.getElementById('post-status').value;
    formData.corpo = document.getElementById('post-corpo').value;
    formData.fonte = document.getElementById('post-fonte').value.trim() || null;
    
    // Imagem
    const imagePathInput = document.getElementById('image-path');
    if (imagePathInput && imagePathInput.value) {
      formData.image_path = imagePathInput.value;
    }
    
    // Adicionar dados de autor (usando usuário atual)
    // formData.author_id = ... // Será preenchido pelo backend
  } else {
    // Coletar dados de curiosidade
    formData.texto = document.getElementById('curiosidade-texto').value.trim();
    formData.data = document.getElementById('curiosidade-data').value;
    formData.status = document.getElementById('curiosidade-status').value;
  }
  
  return formData;
};

/**
 * Gerencia o botão de configurações e suas funcionalidades
 */
const handleConfigButton = () => {
  const configBtn = document.getElementById('btn-config');
  const configModal = document.getElementById('config-modal');
  
  if (configBtn && configModal) {
    console.log('handleConfigButton: Botão e modal de configurações encontrados.');
    
    // Configurar botão para abrir o modal
    configBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('handleConfigButton: Botão de configurações clicado.');
      
      // Abrir o modal
      if (Modal) {
        Modal.open('config-modal');
        
        // Carregar dados do perfil
        const user = await api.auth.getCurrentUser();
        if (user) {
          const profileNameInput = document.getElementById('profile-name');
          const profileEmailInput = document.getElementById('profile-email');
          
          if (profileNameInput && profileEmailInput) {
            profileNameInput.value = user.user_metadata?.name || '';
            profileEmailInput.value = user.email || '';
          }
        }
      } else {
        // Fallback se Modal não estiver disponível
        configModal.classList.add('active');
      }
    });
    
    // Configurar abas dentro do modal
    const configTabBtns = document.querySelectorAll('.config-tab-btn');
    const configTabPanels = document.querySelectorAll('.config-tab-panel');
    
    configTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabTarget = btn.dataset.tab;
        
        // Desativar todas as abas e painéis
        configTabBtns.forEach(b => b.classList.remove('active'));
        configTabPanels.forEach(p => p.classList.remove('active'));
        
        // Ativar a aba e painel selecionados
        btn.classList.add('active');
        document.getElementById(tabTarget)?.classList.add('active');
      });
    });
    
    // Configurar formulário de perfil
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const profileName = document.getElementById('profile-name').value;
        
        try {
          const { success, error } = await api.auth.updateProfile({ name: profileName });
          
          if (success) {
            Toast.show('Perfil atualizado com sucesso!', 'success');
            
            // Atualizar o nome exibido no sidebar
            const adminNameEl = document.getElementById('admin-name');
            if (adminNameEl) {
              adminNameEl.textContent = profileName || 'Administrador';
            }
            
            // Fechar o modal
            if (Modal) {
              Modal.close('config-modal');
            } else {
              configModal.classList.remove('active');
            }
          } else {
            Toast.show(error || 'Erro ao atualizar perfil', 'error');
          }
        } catch (err) {
          console.error('handleConfigButton: Erro ao atualizar perfil:', err);
          Toast.show('Erro ao atualizar perfil', 'error');
        }
      });
    }
    
    // Configurar formulário de senha
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validar senhas
        if (newPassword !== confirmPassword) {
          Toast.show('As senhas não coincidem', 'error');
          return;
        }
        
        try {
          const { success, error } = await api.auth.updatePassword(newPassword);
          
          if (success) {
            Toast.show('Senha atualizada com sucesso!', 'success');
            
            // Limpar campos
            passwordForm.reset();
            
            // Fechar o modal
            if (Modal) {
              Modal.close('config-modal');
            } else {
              configModal.classList.remove('active');
            }
          } else {
            Toast.show(error || 'Erro ao atualizar senha', 'error');
          }
        } catch (err) {
          console.error('handleConfigButton: Erro ao atualizar senha:', err);
          Toast.show('Erro ao atualizar senha', 'error');
        }
      });
    }
  } else {
    console.log('handleConfigButton: Botão ou modal de configurações não encontrado.');
  }
};

/**
 * Carrega dados para o dashboard
 */
const loadDashboardData = async () => {
  console.log('Carregando dados do dashboard');
  
  try {
    // Atualiza contadores
    updateDashboardStats();
    
    // Carrega tabelas de dados
    await loadNewsTable();
    await loadCuriositiesTable();
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    Toast.show('Erro ao carregar dados do dashboard', 'error');
  }
};

/**
 * Atualiza as estatísticas do dashboard
 */
const updateDashboardStats = async () => {
  try {
    // Buscar estatísticas do backend
    const stats = await api.admin.getStats();
    
    // Atualizar contadores
    if (stats) {
      document.getElementById('total-noticias').textContent = stats.posts.total || '0';
      document.getElementById('noticias-change').textContent = `${stats.posts.percentChange || 0}%`;
      
      document.getElementById('total-curiosidades').textContent = stats.curiosities.total || '0';
      document.getElementById('curiosidades-change').textContent = `${stats.curiosities.percentChange || 0}%`;
      
      document.getElementById('total-views').textContent = stats.views.total || '0';
      document.getElementById('views-change').textContent = `${stats.views.percentChange || 0}%`;
      
      document.getElementById('total-admins').textContent = stats.users.total || '1';
      document.getElementById('admins-change').textContent = `${stats.users.percentChange || 0}%`;
    }
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
};

/**
 * Carrega a tabela de notícias
 */
const loadNewsTable = async () => {
  const tableBody = document.getElementById('noticias-tbody');
  
  if (!tableBody) return;
  
  try {
    // Estado de carregamento
    tableBody.innerHTML = `
      <tr class="table-loader">
        <td colspan="7">
          <div class="skeleton-loader"></div>
        </td>
      </tr>
    `;
    
    // Buscar notícias
    const news = await api.posts.getAllPosts();
    
    // Se não houver notícias
    if (!news || news.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">Nenhuma notícia encontrada</td>
        </tr>
      `;
      return;
    }
    
    // Renderizar as notícias na tabela
    tableBody.innerHTML = news.map(item => `
      <tr>
        <td>${item.id}</td>
        <td>${item.titulo}</td>
        <td>${item.author || 'Admin'}</td>
        <td>${item.fonte || 'Curumim News'}</td>
        <td>${new Date(item.data_publicacao).toLocaleDateString('pt-BR')}</td>
        <td>
          <span class="status-badge ${item.status || 'published'}">
            ${item.status === 'draft' ? 'Rascunho' : 
              item.status === 'scheduled' ? 'Agendada' : 'Publicada'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <a href="/admin/editor.html?mode=edit&type=post&id=${item.id}" class="btn-icon edit" title="Editar">
              <i class="fas fa-edit"></i>
            </a>
            <a href="/noticia.html?slug=${item.slug}" target="_blank" class="btn-icon view" title="Visualizar">
              <i class="fas fa-eye"></i>
            </a>
            <button class="btn-icon delete" title="Excluir" data-id="${item.id}" data-type="post">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Adicionar listeners para botões de exclusão
    const deleteButtons = tableBody.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
      button.addEventListener('click', handleDeleteItem);
    });
    
  } catch (error) {
    console.error('Erro ao carregar tabela de notícias:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">Erro ao carregar notícias. Tente novamente.</td>
      </tr>
    `;
  }
};

/**
 * Carrega a tabela de curiosidades
 */
const loadCuriositiesTable = async () => {
  const tableBody = document.getElementById('curiosidades-tbody');
  
  if (!tableBody) return;
  
  try {
    // Loader...
    tableBody.innerHTML = `
      <tr class="table-loader">
        <td colspan="5">
          <div class="skeleton-loader"></div>
        </td>
      </tr>
    `;
    
    // Buscar curiosidades
    const curiosities = await api.curiosities.getAllCuriosities();
    
    // Se não houver curiosidades
    if (!curiosities || curiosities.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">Nenhuma curiosidade encontrada</td>
        </tr>
      `;
      return;
    }
    
    // Renderizar as curiosidades na tabela
    tableBody.innerHTML = curiosities.map(item => `
      <tr>
        <td>${item.id}</td>
        <td>${item.texto.substring(0, 100)}${item.texto.length > 100 ? '...' : ''}</td>
        <td>${new Date(item.data).toLocaleDateString('pt-BR')}</td>
        <td>
          <span class="status-badge ${item.status || 'published'}">
            ${item.status === 'draft' ? 'Rascunho' : 'Publicada'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <a href="/admin/editor.html?mode=edit&type=curiosidade&id=${item.id}" class="btn-icon edit" title="Editar">
              <i class="fas fa-edit"></i>
            </a>
            <button class="btn-icon delete" title="Excluir" data-id="${item.id}" data-type="curiosidade">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Adicionar listeners para botões de exclusão
    const deleteButtons = tableBody.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
      button.addEventListener('click', handleDeleteItem);
    });
    
  } catch (error) {
    console.error('Erro ao carregar tabela de curiosidades:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">Erro ao carregar curiosidades. Tente novamente.</td>
      </tr>
    `;
  }
};

/**
 * Manipula a exclusão de itens
 */
const handleDeleteItem = async (e) => {
  const itemId = e.currentTarget.dataset.id;
  const itemType = e.currentTarget.dataset.type;
  
  if (!itemId || !itemType) return;
  
  const confirmation = confirm(`Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.`);
  
  if (!confirmation) return;
  
  try {
    let success = false;
    
    if (itemType === 'post') {
      success = await api.posts.deletePost(itemId);
    } else if (itemType === 'curiosidade') {
      success = await api.curiosities.deleteCuriosity(itemId);
    }
    
    if (success) {
      Toast.show('Item excluído com sucesso!', 'success');
      // Recarregar a tabela apropriada
      if (itemType === 'post') {
        loadNewsTable();
      } else if (itemType === 'curiosidade') {
        loadCuriositiesTable();
      }
      // Atualizar estatísticas
      updateDashboardStats();
    } else {
      Toast.show('Não foi possível excluir o item. Tente novamente.', 'error');
    }
  } catch (error) {
    console.error(`Erro ao excluir ${itemType}:`, error);
    Toast.show('Ocorreu um erro ao excluir o item. Tente novamente.', 'error');
  }
};

/**
 * Inicialização específica para páginas de administração.
 */
const initAdminPage = async () => {
  console.log('initAdminPage: Inicializando página de admin.');
  const user = await checkAuthStatus(); // Verifica e redireciona se necessário

  // Se checkAuthStatus redirecionou, user será null e não devemos prosseguir.
  // Ou, se a página atual for a de login e o usuário já está logado, ele já foi redirecionado.
  if (!user && window.location.pathname !== '/admin/login.html') {
    console.log('initAdminPage: Usuário não autenticado após checkAuthStatus ou redirecionamento pendente. Saindo da inicialização.');
    return;
  }
  
  // Adiciona manipuladores de evento apenas se os elementos existirem na página atual
  if (document.getElementById('login-form')) {
    console.log('initAdminPage: Página de login detectada, configurando formulário de login.');
    handleLoginForm();
    handleForgotPassword();
    // handleTogglePassword(); // Chamado dentro de initAdminUIComponents ou globalmente se aplicável a todas as páginas admin
  }

  // Inicializa componentes de UI comuns em todas as páginas admin autenticadas
  // Exceto na página de login, onde alguns desses componentes podem não existir ou ser inicializados de forma diferente.
  if (window.location.pathname !== '/admin/login.html') {
    initAdminUIComponents(); // Isso já chama handleTogglePassword, handleConfigButton etc.
  } else {
    // Para a página de login, apenas o toggle de senha é relevante dos UI comuns que não são parte do form
    handleTogglePassword();
  }
  
  // Lógica específica para páginas após UI comum ter sido inicializada
  if (document.body.classList.contains('admin-dashboard')) {
    console.log('initAdminPage: Dashboard detectado.');
    const adminNameEl = document.getElementById('admin-name');
    if(adminNameEl && user && user.user_metadata) { // Checa se user.user_metadata existe
        adminNameEl.textContent = user.user_metadata.name || user.email;
    } else if (adminNameEl && user && user.email) { // Fallback para email se nome não estiver em metadata
        adminNameEl.textContent = user.email;
    }
    loadDashboardData();
  }
  
  if (document.body.classList.contains('admin-editor')) {
    console.log('initAdminPage: Editor detectado.');
    // A inicialização do editor (initEditorPage) é feita exclusivamente por editor.js,
    // que é carregado em admin/editor.html.
    // initAdminUIComponents() já foi chamado acima se não for login.html.
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    console.log('initAdminPage: Botão de logout encontrado.');
    logoutBtn.addEventListener('click', async () => {
      console.log('initAdminPage: Logout clicado.');
      const { success, error } = await api.auth.logout();
      if (success) {
        Toast.show('Logout realizado com sucesso.', 'success');
        window.location.href = '/admin/login.html';
      } else {
        Toast.show(error || 'Erro ao fazer logout.', 'error');
      }
    });
  }
  
  // handleConfigButton(); // Já é chamado dentro de initAdminUIComponents
  
  console.log('initAdminPage: Inicialização da página de admin concluída.');
};

// Inicializar página de admin ao carregar
window.addEventListener('DOMContentLoaded', initAdminPage);