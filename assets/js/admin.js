import api from './api.js';
import { Utils, Toast, Modal, Loader } from './main.js'; // Supondo que Modal e Loader possam ser úteis

console.log('admin.js carregado');

// Variáveis globais para o editor
let quillEditor;    // Instância do editor Quill
let editorMode;    // 'create' ou 'edit'
let editorType;    // 'post' ou 'curiosidade'
let editorId;      // ID do item em edição (se aplicável)
let currentImagePath; // Caminho da imagem atual no storage (se aplicável)

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
  handleTabs();
  handleSubmenus();
  handleThemeToggle();
};

/**
 * Inicializa o Editor Quill para WYSIWYG
 */
const initQuillEditor = () => {
  if (!document.getElementById('editor-container')) return;
  
  // Definir as opções e ferramentas do editor
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean'],
    ['link', 'image']
  ];

  // Inicializar o editor Quill
  quillEditor = new Quill('#editor-container', {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow',
    placeholder: 'Comece a escrever o conteúdo aqui...'
  });

  // Quando o conteúdo do editor mudar, atualize o textarea oculto
  // para que os dados sejam enviados com o formulário
  quillEditor.on('text-change', function() {
    const editorContent = document.getElementById(editorType === 'post' ? 'post-corpo' : 'curiosidade-texto');
    if (editorContent) {
      editorContent.value = quillEditor.root.innerHTML;
    }
  });

  console.log('Editor Quill inicializado');
};

/**
 * Inicializa manipuladores de contagem de caracteres para campos com limite
 */
const initCharCounters = () => {
  const resumoTextarea = document.getElementById('post-resumo');
  const resumoCounter = document.getElementById('resumo-counter');
  
  if (resumoTextarea && resumoCounter) {
    resumoTextarea.addEventListener('input', () => {
      const length = resumoTextarea.value.length;
      resumoCounter.textContent = length;
      
      // Adiciona classe de aviso se estiver perto do limite
      if (length > 180) {
        resumoCounter.classList.add('char-limit-warning');
      } else {
        resumoCounter.classList.remove('char-limit-warning');
      }
    });
  }
};

/**
 * Inicializa o manipulador para geração automática de slug
 */
const initSlugGenerator = () => {
  const btnGerarSlug = document.getElementById('gerar-slug');
  const titleInput = document.getElementById('post-title');
  const slugInput = document.getElementById('post-slug');
  
  if (btnGerarSlug && titleInput && slugInput) {
    btnGerarSlug.addEventListener('click', () => {
      const title = titleInput.value.trim();
      if (!title) {
        Toast.show('Digite um título para gerar o slug!', 'error');
        return;
      }
      
      // Gerar slug a partir do título
      const slug = title
        .toLowerCase()
        .normalize('NFD') // Normaliza caracteres com acentos
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Evita múltiplos hífens
        .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
      
      slugInput.value = slug;
      Toast.show('Slug gerado com sucesso!', 'success');
    });
    
    // Adiciona a mesma funcionalidade ao perder o foco do título,
    // mas apenas se o slug estiver vazio
    titleInput.addEventListener('blur', () => {
      if (slugInput.value.trim() === '' && titleInput.value.trim() !== '') {
        btnGerarSlug.click();
      }
    });
  }
};

/**
 * Inicializa o manipulador para upload e preview de imagens
 */
const initImageUpload = () => {
  const imageInput = document.getElementById('post-image');
  const previewImg = document.getElementById('preview-img');
  const removeImageBtn = document.getElementById('remove-image');
  const imagePathInput = document.getElementById('image-path');
  const progressBar = document.getElementById('progress-bar');
  const uploadProgress = document.getElementById('upload-progress');
  
  if (imageInput && previewImg && removeImageBtn) {
    // Tratamento do upload de arquivo
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      
      if (!file) return;
      
      // Validar tipo de arquivo
      if (!file.type.match('image.*')) {
        Toast.show('Por favor, selecione uma imagem válida (JPG, PNG, WEBP).', 'error');
        return;
      }
      
      // Validar tamanho (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        Toast.show('A imagem deve ter no máximo 2MB.', 'error');
        return;
      }
      
      // Exibir preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.parentElement.classList.add('has-image');
      };
      reader.readAsDataURL(file);
      
      // Iniciar upload
      try {
        // Mostrar barra de progresso
        if (progressBar && uploadProgress) {
          progressBar.style.width = '0%';
          uploadProgress.classList.add('visible');
        }
        
        // Preparar nome do arquivo
        const extension = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;
        const filePath = editorType === 'post' ? `noticias/${fileName}` : `curiosidades/${fileName}`;
        
        // Fazer upload
        const updateProgress = (percent) => {
          if (progressBar) {
            progressBar.style.width = `${percent}%`;
          }
        };
        
        // Usar a função de upload com progresso
        const result = await api.storage.uploadImage(file, editorType === 'post' ? 'noticias' : 'curiosidades', updateProgress);
        
        if (result.success) {
          // Guardar o caminho da imagem
          currentImagePath = result.path;
          if (imagePathInput) {
            imagePathInput.value = result.url;
          }
          Toast.show('Imagem enviada com sucesso!', 'success');
        } else {
          Toast.show(`Erro ao enviar imagem: ${result.error}`, 'error');
        }
      } catch (error) {
        console.error('Erro no upload de imagem:', error);
        Toast.show('Ocorreu um erro ao enviar a imagem. Tente novamente.', 'error');
      } finally {
        // Esconder barra de progresso
        if (uploadProgress) {
          setTimeout(() => {
            uploadProgress.classList.remove('visible');
          }, 1000);
        }
      }
    });
    
    // Remover imagem
    removeImageBtn.addEventListener('click', async () => {
      // Se temos um caminho de imagem atual e estamos no modo edição,
      // vamos remover a imagem do storage
      if (currentImagePath && editorMode === 'edit') {
        try {
          await api.storage.deleteImage(currentImagePath);
        } catch (error) {
          console.error('Erro ao excluir imagem do storage:', error);
        }
      }
      
      // Resetar UI
      previewImg.src = '../assets/img/placeholder-image.jpg';
      previewImg.parentElement.classList.remove('has-image');
      imageInput.value = '';
      if (imagePathInput) {
        imagePathInput.value = '';
      }
      currentImagePath = null;
      
      Toast.show('Imagem removida!', 'info');
    });
  }
};

/**
 * Obtém e processa os parâmetros da URL
 * @returns {Object} Objeto com os parâmetros mode, type e id
 */
const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    mode: urlParams.get('mode') || 'create',
    type: urlParams.get('type') || 'post',
    id: urlParams.get('id')
  };
};

/**
 * Inicializa a página do editor com base nos parâmetros da URL
 */
const initEditorPage = async () => {
  console.log('Inicializando página do editor');
  
  // Obter parâmetros da URL
  const params = getUrlParams();
  editorMode = params.mode;
  editorType = params.type;
  editorId = params.id;
  
  console.log('Parâmetros do editor:', params);
  
  // Atualizar elementos da UI
  const editorTitle = document.getElementById('editor-title');
  const breadcrumbType = document.getElementById('breadcrumb-type');
  const breadcrumbAction = document.getElementById('breadcrumb-action');
  
  if (editorTitle) {
    editorTitle.textContent = editorMode === 'create' 
      ? (editorType === 'post' ? 'Nova Notícia' : 'Nova Curiosidade')
      : (editorType === 'post' ? 'Editar Notícia' : 'Editar Curiosidade');
  }
  
  if (breadcrumbType) {
    breadcrumbType.textContent = editorType === 'post' ? 'Notícias' : 'Curiosidades';
  }
  
  if (breadcrumbAction) {
    breadcrumbAction.textContent = editorMode === 'create' ? 'Nova' : 'Editar';
  }
  
  // Mostrar o formulário correto
  const postForm = document.getElementById('post-form');
  const curiosidadeForm = document.getElementById('curiosidade-form');
  
  if (postForm && curiosidadeForm) {
    if (editorType === 'post') {
      postForm.classList.remove('hidden');
      curiosidadeForm.classList.add('hidden');
    } else {
      postForm.classList.add('hidden');
      curiosidadeForm.classList.remove('hidden');
    }
  }
  
  // Atualizar campos hidden do formulário
  const editorIdInput = document.getElementById('editor-id');
  const editorTypeInput = document.getElementById('editor-type');
  const editorModeInput = document.getElementById('editor-mode');
  
  if (editorIdInput) editorIdInput.value = editorId || '';
  if (editorTypeInput) editorTypeInput.value = editorType;
  if (editorModeInput) editorModeInput.value = editorMode;
  
  // Inicializar componentes do editor
  initQuillEditor();
  initCharCounters();
  initSlugGenerator();
  initImageUpload();
  
  // Se estamos no modo edição, carregar dados
  if (editorMode === 'edit' && editorId) {
    await loadContentForEditing();
  } else {
    // Preencher data atual para nova publicação
    const dataInput = document.getElementById('post-data');
    if (dataInput) {
      const now = new Date();
      const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      dataInput.value = isoString;
    }
  }
  
  // Inicializar formulário
  initEditorForm();
};

/**
 * Carrega os dados de um item existente para edição
 */
const loadContentForEditing = async () => {
  console.log(`Carregando ${editorType} com ID ${editorId} para edição`);
  
  // Mostrar loader
  Loader.show('Carregando conteúdo...');
  
  try {
    let result;
    
    // Buscar dados dependendo do tipo
    if (editorType === 'post') {
      result = await api.posts.getById(editorId);
    } else {
      result = await api.curiosidades.getById(editorId);
    }
    
    if (!result.success || !result.data) {
      throw new Error('Não foi possível carregar o conteúdo para edição.');
    }
    
    const item = result.data;
    
    // Preencher os campos do formulário
    if (editorType === 'post') {
      // Campos específicos de post
      document.getElementById('post-title').value = item.titulo || '';
      document.getElementById('post-slug').value = item.slug || '';
      document.getElementById('post-fonte').value = item.fonte || '';
      document.getElementById('post-resumo').value = item.resumo || '';
      
      // Data de publicação
      const dataInput = document.getElementById('post-data');
      if (dataInput && item.data_publicacao) {
        const date = new Date(item.data_publicacao);
        const isoString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        dataInput.value = isoString;
      }
      
      // Status
      const statusSelect = document.getElementById('post-status');
      if (statusSelect && item.status) {
        statusSelect.value = item.status;
      }
      
      // Imagem
      if (item.image_path) {
        const previewImg = document.getElementById('preview-img');
        const imagePathInput = document.getElementById('image-path');
        
        if (previewImg) {
          previewImg.src = item.image_path;
          previewImg.parentElement.classList.add('has-image');
        }
        
        if (imagePathInput) {
          imagePathInput.value = item.image_path;
        }
        
        // Armazenar o caminho para possível exclusão
        currentImagePath = item.image_path;
      }
      
      // Conteúdo no editor
      if (quillEditor && item.corpo) {
        quillEditor.root.innerHTML = item.corpo;
        document.getElementById('post-corpo').value = item.corpo;
      }
    } else {
      // Campos específicos de curiosidade
      document.getElementById('curiosidade-texto').value = item.texto || '';
      
      // Data
      const dataInput = document.getElementById('curiosidade-data');
      if (dataInput && item.data) {
        const date = new Date(item.data);
        const isoString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        dataInput.value = isoString;
      }
      
      // Status
      const statusSelect = document.getElementById('curiosidade-status');
      if (statusSelect && item.status) {
        statusSelect.value = item.status;
      }
      
      // Conteúdo no editor (se aplicável para curiosidades)
      if (quillEditor && document.getElementById('curiosidade-texto')) {
        quillEditor.root.innerHTML = item.texto || '';
      }
    }
    
    // Atualizar contadores de caracteres
    const resumoTextarea = document.getElementById('post-resumo');
    const resumoCounter = document.getElementById('resumo-counter');
    
    if (resumoTextarea && resumoCounter) {
      resumoCounter.textContent = resumoTextarea.value.length;
    }
    
    Toast.show('Conteúdo carregado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao carregar conteúdo para edição:', error);
    Toast.show(`Erro ao carregar conteúdo: ${error.message}`, 'error');
  } finally {
    Loader.hide();
  }
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
    handleTogglePassword();
  }

  if (document.body.classList.contains('admin-dashboard')) {
    console.log('initAdminPage: Dashboard detectado.');
    // Lógica específica do dashboard (carregar dados, etc.)
    const adminNameEl = document.getElementById('admin-name');
    if(adminNameEl && user && user.email) {
        adminNameEl.textContent = user.user_metadata?.name || user.email;
    }
    // Inicializar UI componentes da dashboard
    initAdminUIComponents();
    
    // Carregar dados iniciais da dashboard
    loadDashboardData();
  }
  
  if (document.body.classList.contains('admin-editor')) {
    console.log('initAdminPage: Editor detectado.');
    // Lógica específica do editor
    initAdminUIComponents();
    // Inicializar componentes do editor e carregar dados se necessário
    initEditorPage();
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
  
  // Configurar o botão e modal de configurações
  handleConfigButton();
  
  console.log('initAdminPage: Inicialização da página de admin concluída.');
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
            <a href="/noticia.html?id=${item.slug}" target="_blank" class="btn-icon view" title="Visualizar">
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

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded: Evento disparado.');
  // Verifica se estamos em uma página de admin antes de rodar initAdminPage
  if(window.location.pathname.startsWith('/admin/')) {
    initAdminPage();
  }
}); 