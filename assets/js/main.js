/**
 * Curumim News - Arquivo JavaScript Principal
 * 
 * Contém funções utilitárias gerais, inicialização do tema,
 * manipulação de elementos comuns e controle de componentes reutilizáveis.
 */

// Importação do módulo de API
import api from './api.js';

// Inicializar funcionalidades globais quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar componentes
  ThemeManager.init();
  setupSearch();
  setupAdminAccess();
  
  // Inicializar outros módulos conforme necessário
  if (document.querySelector('.toast')) {
    Toast.init();
  }
  
  if (document.querySelector('.dropdown')) {
    Dropdown.init();
  }
  
  if (document.querySelector('.modal')) {
    Modal.init();
  }
  
  if (document.querySelector('.newsletter-form')) {
    Newsletter.init();
  }
});

/**
 * Configura a funcionalidade de pesquisa
 */
function setupSearch() {
  const searchInput = document.querySelector('.search-box input');
  const searchButton = document.querySelector('.search-button');
  const voiceSearchButton = document.querySelector('.voice-search');
  
  if (!searchInput || !searchButton) return;
  
  // Função para executar a pesquisa
  const executeSearch = () => {
    const term = searchInput.value.trim();
    
    if (term) {
      // Redirecionar para a página de resultados com o termo de busca
      window.location.href = `/pesquisa.html?q=${encodeURIComponent(term)}`;
    }
  };
  
  // Adicionar ouvinte para o botão de pesquisa
  searchButton.addEventListener('click', executeSearch);
  
  // Adicionar ouvinte para tecla Enter no input
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  });
  
  // Adicionar ouvinte para pesquisa por voz (se disponível)
  if (voiceSearchButton && 'webkitSpeechRecognition' in window) {
    voiceSearchButton.addEventListener('click', () => {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = 'pt-BR';
      
      // Feedback visual
      voiceSearchButton.classList.add('listening');
      Toast.show('Fale agora...', 'info');
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        
        // Pequeno delay para melhor experiência do usuário
        setTimeout(executeSearch, 500);
      };
      
      recognition.onerror = () => {
        Toast.show('Não foi possível reconhecer a fala', 'error');
        voiceSearchButton.classList.remove('listening');
      };
      
      recognition.onend = () => {
        voiceSearchButton.classList.remove('listening');
      };
      
      recognition.start();
    });
  } else if (voiceSearchButton) {
    // Esconder botão se a API não estiver disponível
    voiceSearchButton.style.display = 'none';
  }
}

/**
 * Configura acesso secreto à área administrativa
 * Utilize Ctrl+Alt+A para acessar
 */
function setupAdminAccess() {
  const keys = {
    ctrl: false,
    alt: false,
    a: false
  };
  
  document.addEventListener('keydown', function(event) {
    // Atualizar estado das teclas
    if (event.key === 'Control') keys.ctrl = true;
    if (event.key === 'Alt') keys.alt = true;
    if (event.key.toLowerCase() === 'a') keys.a = true;
    
    // Verificar combinação Ctrl+Alt+A
    if (keys.ctrl && keys.alt && keys.a) {
      // Redirecionar para a página de login admin
      window.location.href = '/admin/login.html';
    }
  });
  
  document.addEventListener('keyup', function(event) {
    // Resetar estado das teclas ao soltar
    if (event.key === 'Control') keys.ctrl = false;
    if (event.key === 'Alt') keys.alt = false;
    if (event.key.toLowerCase() === 'a') keys.a = false;
  });
  
  // Adicionar link oculto no rodapé que só aparece ao passar o mouse
  const footerLinks = document.querySelector('.footer-section:nth-child(3) ul');
  if (footerLinks) {
    const adminLink = document.createElement('li');
    adminLink.className = 'hidden-admin-link';
    adminLink.innerHTML = '<a href="/admin/login.html">Área Administrativa</a>';
    adminLink.style.opacity = '0';
    adminLink.style.transition = 'opacity 0.3s ease';
    
    // Mostrar ao passar o mouse no footer
    const footer = document.querySelector('.site-footer');
    if (footer) {
      footer.addEventListener('mouseover', function() {
        adminLink.style.opacity = '0.5';
      });
      
      footer.addEventListener('mouseout', function() {
        adminLink.style.opacity = '0';
      });
    }
    
    footerLinks.appendChild(adminLink);
  }
}

// ----------------
// Utilitários
// ----------------

/**
 * Classe de Utilitários
 */
export const Utils = {
  /**
   * Formata uma data para exibição
   * @param {string|Date} date - Data a ser formatada
   * @param {boolean} includeTime - Se deve incluir a hora
   * @returns {string} Data formatada
   */
  formatDate: (date, includeTime = false) => {
    if (!date) return '';
    
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return new Date(date).toLocaleDateString('pt-BR', options);
  },
  
  /**
   * Calcula tempo de leitura aproximado
   * @param {string} text - Texto para cálculo
   * @returns {number} Tempo em minutos
   */
  calculateReadingTime: (text) => {
    if (!text) return 1;
    
    // Média de 200 palavras por minuto
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / wordsPerMinute);
    
    return readingTime < 1 ? 1 : readingTime;
  },
  
  /**
   * Trunca um texto para o tamanho especificado
   * @param {string} text - Texto a ser truncado
   * @param {number} length - Tamanho máximo
   * @returns {string} Texto truncado
   */
  truncateText: (text, length = 100) => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
  },
  
  /**
   * Converte slug para título
   * @param {string} slug - Slug a ser convertido
   * @returns {string} Título
   */
  slugToTitle: (slug) => {
    if (!slug) return '';
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },
  
  /**
   * Debounce para evitar múltiplas chamadas de função
   * @param {Function} func - Função a ser executada
   * @param {number} wait - Tempo de espera em ms
   * @returns {Function} Função com debounce
   */
  debounce: (func, wait = 300) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  
  /**
   * Gera ID único
   * @returns {string} ID aleatório
   */
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  /**
   * Converte bytes para uma string legível
   * @param {number} bytes - Número de bytes
   * @returns {string} Tamanho formatado
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  /**
   * Gera um slug a partir de um texto
   * @param {string} text - Texto para gerar o slug
   * @returns {string} Slug gerado
   */
  generateSlug: (text) => {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  },
  
  /**
   * Copia texto para a área de transferência
   * @param {string} text - Texto a ser copiado
   * @returns {Promise<boolean>} Sucesso da operação
   */
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Erro ao copiar para a área de transferência:', error);
      return false;
    }
  },
  
  /**
   * Obtém parâmetros da URL
   * @param {string} param - Nome do parâmetro
   * @returns {string|null} Valor do parâmetro ou null
   */
  getUrlParam: (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * Detecta se é dispositivo móvel
   * @returns {boolean} Verdadeiro se for dispositivo móvel
   */
  isMobileDevice: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  /**
   * Sanitiza HTML para prevenir XSS
   * @param {string} html - HTML a ser sanitizado
   * @returns {string} HTML sanitizado
   */
  sanitizeHTML: (html) => {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  },
  
  /**
   * Detecta suporte a dark mode no sistema
   * @returns {boolean} Verdadeiro se preferir dark mode
   */
  prefersDarkMode: () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
};

// ----------------
// Gerenciador de Tema
// ----------------

/**
 * Controlador do tema
 */
export const ThemeManager = {
  // Chave no localStorage
  STORAGE_KEY: 'curuminNews_theme',
  
  /**
   * Inicializa o tema
   */
  init() {
    this.loadTheme();
    this.setupListeners();
  },
  
  /**
   * Carrega o tema salvo ou usa a preferência do sistema
   */
  loadTheme() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Define 'light' como padrão se nada estiver salvo e removemos a detecção automática
      this.setTheme('light'); 
    }
  },
  
  /**
   * Configura listeners de evento
   */
  setupListeners() {
    const themeToggleButtons = document.querySelectorAll('.theme-toggle');
    
    themeToggleButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.toggleTheme();
      });
    });
  },
  
  /**
   * Alterna entre temas claro e escuro
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log(`Alternando tema: ${currentTheme} -> ${newTheme}`);
    this.setTheme(newTheme);
    localStorage.setItem(this.STORAGE_KEY, newTheme);
    
    // Evento personalizado para notificar outras partes da aplicação
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  },
  
  /**
   * Define um tema específico
   * @param {string} theme - Nome do tema ('light' ou 'dark')
   */
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Atualizar ícones
    const themeToggles = document.querySelectorAll('.theme-toggle i');
    themeToggles.forEach(icon => {
      if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    });
    
    // Salvar no localStorage para persistência
    localStorage.setItem(this.STORAGE_KEY, theme);
    
    console.log(`Tema definido para: ${theme}`);
  },
  
  /**
   * Obtém o tema atual
   * @returns {string} Nome do tema atual
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme');
  }
};

// ----------------
// Componente Toast
// ----------------

/**
 * Gerenciador de notificações Toast
 */
export const Toast = {
  /**
   * Inicializa o componente Toast
   */
  init() {
    // Toast não precisa de inicialização específica
    console.log('Toast inicializado');
  },

  /**
   * Mostra uma mensagem toast
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo de mensagem (success, error, warning, info)
   * @param {number} duration - Duração em ms
   */
  show: (message, type = 'info', duration = 3000) => {
    // Verifica se já existe um toast container
    let toastContainer = document.querySelector('.toast-container');
    
    // Se não existir, cria um novo
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Cria o toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    
    // Adiciona ícone com base no tipo
    let icon;
    switch (type) {
      case 'success':
        icon = 'fa-check-circle';
        break;
      case 'error':
        icon = 'fa-times-circle';
        break;
      case 'warning':
        icon = 'fa-exclamation-triangle';
        break;
      default:
        icon = 'fa-info-circle';
    }
    
    // Define o conteúdo do toast
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas ${icon}"></i>
      </div>
      <div class="toast-content">
        <p>${message}</p>
      </div>
      <button class="toast-close" aria-label="Fechar">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Adiciona o toast ao container
    toastContainer.appendChild(toast);
    
    // Adiciona evento para fechar manualmente
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        toast.remove();
      }, 300);
    });
    
    // Adiciona classe para animar a entrada
    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, 10);
    
    // Remove o toast após o tempo determinado
    setTimeout(() => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
};

// ----------------
// Navegação Mobile
// ----------------

/**
 * Controlador da navegação mobile
 */
export const MobileNav = {
  /**
   * Inicializa a navegação mobile
   */
  init() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (menuToggle && navList) {
      menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navList.classList.toggle('active');
      });
      
      // Fechar menu ao clicar em link
      const navLinks = navList.querySelectorAll('a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          menuToggle.classList.remove('active');
          navList.classList.remove('active');
        });
      });
      
      // Fechar menu ao clicar fora
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.main-nav') && !e.target.closest('.menu-toggle')) {
          menuToggle.classList.remove('active');
          navList.classList.remove('active');
        }
      });
    }
  }
};

// ----------------
// Skeletons e Loaders
// ----------------

/**
 * Utilitário para gerenciar loaders e skeletons
 */
export const Loader = {
  /**
   * Mostra o loader
   * @param {string} message - Mensagem opcional
   */
  show: (message = 'Carregando...') => {
    // Verifica se já existe um loader
    if (document.querySelector('.loader-overlay')) {
      return;
    }
    
    // Cria a estrutura do loader
    const loaderOverlay = document.createElement('div');
    loaderOverlay.className = 'loader-overlay';
    
    loaderOverlay.innerHTML = `
      <div class="loader-wrapper">
        <div class="loader-spinner"></div>
        <p class="loader-message">${message}</p>
      </div>
    `;
    
    // Adiciona o loader ao DOM
    document.body.appendChild(loaderOverlay);
    
    // Adiciona classe para animar a entrada
    setTimeout(() => {
      loaderOverlay.classList.add('loader-visible');
    }, 10);
  },
  
  /**
   * Esconde o loader
   */
  hide: () => {
    const loaderOverlay = document.querySelector('.loader-overlay');
    
    if (loaderOverlay) {
      loaderOverlay.classList.remove('loader-visible');
      setTimeout(() => {
        loaderOverlay.remove();
      }, 300);
    }
  },
  
  /**
   * Atualiza a mensagem do loader
   * @param {string} message - Nova mensagem
   */
  updateMessage: (message) => {
    const loaderMessage = document.querySelector('.loader-message');
    
    if (loaderMessage) {
      loaderMessage.textContent = message;
    }
  }
};

// ----------------
// Componente Modal
// ----------------

/**
 * Gerenciador de modais
 */
export const Modal = {
  /**
   * Inicializa o Modal
   */
  init() {
    // Adiciona event listeners para todos os botões que abrem modais
    document.querySelectorAll('[data-modal]').forEach(button => {
      button.addEventListener('click', () => {
        const modalId = button.dataset.modal;
        this.open(modalId);
      });
    });
    
    // Adiciona event listeners para botões de fechar modais
    document.querySelectorAll('.close-modal').forEach(button => {
      const modal = button.closest('.modal');
      button.addEventListener('click', () => {
        if (modal) {
          this.close(modal.id);
        }
      });
    });
    
    // Adiciona event listeners para fechar modais clicando no overlay
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close(modal.id);
        }
      });
    });
  },
  
  /**
   * Abre um modal existente no DOM pelo ID
   * @param {string} modalId - ID do elemento modal
   */
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },
  
  /**
   * Fecha um modal existente no DOM pelo ID
   * @param {string} modalId - ID do elemento modal
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Mostra um modal
   * @param {Object} options - Opções do modal
   * @param {string} options.title - Título do modal
   * @param {string} options.content - Conteúdo HTML do modal
   * @param {Array} options.buttons - Botões do modal [{label, class, action}]
   * @param {boolean} options.closeOnOverlay - Se o modal deve fechar ao clicar no overlay
   * @param {string} options.size - Tamanho do modal (small, medium, large)
   * @returns {Object} Objeto do modal com método close
   */
  show: (options) => {
    const defaults = {
      title: 'Aviso',
      content: '',
      buttons: [
        {
          label: 'OK',
          class: 'btn-primary',
          action: () => modal.close()
        }
      ],
      closeOnOverlay: true,
      size: 'medium'
    };
    
    const settings = { ...defaults, ...options };
    
    // Cria a estrutura do modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalWrapper = document.createElement('div');
    modalWrapper.className = `modal-wrapper modal-${settings.size}`;
    modalWrapper.setAttribute('role', 'dialog');
    modalWrapper.setAttribute('aria-modal', 'true');
    
    // Adiciona o conteúdo do modal
    modalWrapper.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${settings.title}</h3>
        <button class="modal-close" aria-label="Fechar">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-content">
        ${settings.content}
      </div>
      <div class="modal-footer"></div>
    `;
    
    // Adiciona os botões
    const modalFooter = modalWrapper.querySelector('.modal-footer');
    settings.buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.className = button.class || 'btn-secondary';
      btn.textContent = button.label;
      btn.addEventListener('click', button.action);
      modalFooter.appendChild(btn);
    });
    
    // Adiciona o modal ao DOM
    modalOverlay.appendChild(modalWrapper);
    document.body.appendChild(modalOverlay);
    
    // Impede o scroll do body
    document.body.style.overflow = 'hidden';
    
    // Adiciona eventos
    const closeBtn = modalWrapper.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.close());
    
    if (settings.closeOnOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          modal.close();
        }
      });
    }
    
    // Adiciona classe para animar a entrada
    setTimeout(() => {
      modalOverlay.classList.add('modal-visible');
    }, 10);
    
    // Objeto do modal
    const modal = {
      /**
       * Fecha o modal
       */
      close: () => {
        modalOverlay.classList.remove('modal-visible');
        setTimeout(() => {
          modalOverlay.remove();
          document.body.style.overflow = '';
        }, 300);
      },
      
      /**
       * Atualiza o conteúdo do modal
       * @param {string} content - Novo conteúdo HTML
       */
      updateContent: (content) => {
        const contentDiv = modalWrapper.querySelector('.modal-content');
        contentDiv.innerHTML = content;
      }
    };
    
    return modal;
  },
  
  /**
   * Mostra uma caixa de confirmação
   * @param {string} message - Mensagem de confirmação
   * @param {Function} onConfirm - Função a ser executada quando confirmar
   * @param {Function} onCancel - Função a ser executada quando cancelar
   * @param {string} title - Título do modal
   * @returns {Object} Objeto do modal
   */
  confirm: (message, onConfirm, onCancel = () => {}, title = 'Confirmação') => {
    return Modal.show({
      title,
      content: `<p>${message}</p>`,
      buttons: [
        {
          label: 'Cancelar',
          class: 'btn-secondary',
          action: () => {
            modal.close();
            onCancel();
          }
        },
        {
          label: 'Confirmar',
          class: 'btn-primary',
          action: () => {
            modal.close();
            onConfirm();
          }
        }
      ]
    });
  },
  
  /**
   * Mostra uma caixa de alerta
   * @param {string} message - Mensagem de alerta
   * @param {string} title - Título do modal
   * @returns {Object} Objeto do modal
   */
  alert: (message, title = 'Aviso') => {
    return Modal.show({
      title,
      content: `<p>${message}</p>`,
      buttons: [
        {
          label: 'OK',
          class: 'btn-primary',
          action: () => modal.close()
        }
      ]
    });
  }
};

// ----------------
// Newsletter
// ----------------

/**
 * Gerenciador do formulário de newsletter
 */
export const Newsletter = {
  /**
   * Inicializa o formulário de newsletter
   */
  init() {
    const form = document.getElementById('newsletter-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  },
  
  /**
   * Manipula o envio do formulário
   * @param {Event} e - Evento de submit
   */
  async handleSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value.trim();
    
    if (!email || !this.validateEmail(email)) {
      Toast.show('Por favor, informe um e-mail válido', 'error');
      return;
    }
    
    try {
      // Simular envio para API
      // Aqui você pode integrar com algum serviço real de newsletter
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Toast.show('Inscrição realizada com sucesso!', 'success');
      emailInput.value = '';
    } catch (error) {
      console.error('Erro ao cadastrar na newsletter:', error);
      Toast.show('Erro ao processar sua inscrição. Tente novamente.', 'error');
    }
  },
  
  /**
   * Valida um e-mail
   * @param {string} email - E-mail a validar
   * @returns {boolean} Se é válido
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
};

// ----------------
// Inicialização
// ----------------

console.log('Curumim News - Inicializado com sucesso'); 