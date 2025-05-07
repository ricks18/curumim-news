/**
 * Curumim News - Arquivo JavaScript Principal
 * 
 * Contém funções utilitárias gerais, inicialização do tema,
 * manipulação de elementos comuns e controle de componentes reutilizáveis.
 */

// Importação do módulo de API
import api from './api.js';

// ----------------
// Utilitários
// ----------------

/**
 * Classe de Utilitários
 */
export const Utils = {
  /**
   * Formata uma data para exibição
   * @param {string} dateString - String ISO de data 
   * @param {boolean} showTime - Se deve incluir a hora
   * @returns {string} Data formatada
   */
  formatDate: (dateString, showTime = false) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: showTime ? '2-digit' : undefined,
      minute: showTime ? '2-digit' : undefined
    };
    
    return date.toLocaleDateString('pt-BR', options);
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
   * Trunca um texto para um número máximo de palavras
   * @param {string} text - Texto original
   * @param {number} wordLimit - Limite de palavras
   * @returns {string} Texto truncado
   */
  truncateText: (text, wordLimit) => {
    if (!text) return '';
    
    const words = text.trim().split(/\s+/);
    
    if (words.length <= wordLimit) {
      return text;
    }
    
    return words.slice(0, wordLimit).join(' ') + '...';
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
    } else if (Utils.prefersDarkMode()) {
      this.setTheme('dark');
    } else {
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
    
    // Detectar mudanças na preferência do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  },
  
  /**
   * Alterna entre temas claro e escuro
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    this.setTheme(newTheme);
    localStorage.setItem(this.STORAGE_KEY, newTheme);
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
  container: null,
  timeouts: {},
  
  /**
   * Inicializa o componente Toast
   */
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      console.error('Elemento toast-container não encontrado');
    }
  },
  
  /**
   * Exibe uma notificação Toast
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo de toast ('success', 'error', 'info')
   * @param {number} duration - Duração em milissegundos
   */
  show(message, type = 'info', duration = 3000) {
    if (!this.container) {
      this.init();
    }
    
    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const id = `toast-${Date.now()}`;
    toast.id = id;
    
    // Definir ícone baseado no tipo
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    // Estrutura do toast
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="toast-content">
        <p>${message}</p>
      </div>
      <div class="toast-close">
        <i class="fas fa-times"></i>
      </div>
    `;
    
    // Adicionar ao container
    this.container.appendChild(toast);
    
    // Configurar botão de fechar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      this.hide(id);
    });
    
    // Auto-remover após duração
    this.timeouts[id] = setTimeout(() => {
      this.hide(id);
    }, duration);
  },
  
  /**
   * Esconde uma notificação Toast
   * @param {string} id - ID do toast a esconder
   */
  hide(id) {
    const toast = document.getElementById(id);
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      
      // Limpar o timeout
      if (this.timeouts[id]) {
        clearTimeout(this.timeouts[id]);
        delete this.timeouts[id];
      }
      
      // Remover do DOM após animação
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
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
   * Mostra um skeleton loader e esconde o conteúdo
   * @param {string} loaderId - ID do elemento loader
   * @param {string} contentId - ID do elemento de conteúdo
   */
  showSkeleton(loaderId, contentId) {
    const loader = document.getElementById(loaderId);
    const content = document.getElementById(contentId);
    
    if (loader) loader.classList.remove('hidden');
    if (content) content.classList.add('hidden');
  },
  
  /**
   * Esconde um skeleton loader e mostra o conteúdo
   * @param {string} loaderId - ID do elemento loader
   * @param {string} contentId - ID do elemento de conteúdo
   */
  hideSkeleton(loaderId, contentId) {
    const loader = document.getElementById(loaderId);
    const content = document.getElementById(contentId);
    
    if (loader) loader.classList.add('hidden');
    if (content) content.classList.remove('hidden');
  },
  
  /**
   * Mostra um indicador de spinner em um botão
   * @param {string} buttonId - ID do botão
   * @param {string} spinnerId - ID do spinner
   * @param {boolean} disable - Se deve desabilitar o botão
   */
  showButtonSpinner(buttonId, spinnerId, disable = true) {
    const button = document.getElementById(buttonId);
    const spinner = document.getElementById(spinnerId);
    
    if (spinner) spinner.classList.remove('hidden');
    if (button && disable) button.disabled = true;
  },
  
  /**
   * Esconde um indicador de spinner em um botão
   * @param {string} buttonId - ID do botão
   * @param {string} spinnerId - ID do spinner
   */
  hideButtonSpinner(buttonId, spinnerId) {
    const button = document.getElementById(buttonId);
    const spinner = document.getElementById(spinnerId);
    
    if (spinner) spinner.classList.add('hidden');
    if (button) button.disabled = false;
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
   * Inicializa os modais na página
   */
  init() {
    // Configurar botões de abrir modal
    document.querySelectorAll('[data-modal]').forEach(button => {
      const modalId = button.getAttribute('data-modal');
      button.addEventListener('click', () => {
        this.open(modalId);
      });
    });
    
    // Configurar botões de fechar modal
    document.querySelectorAll('.close-modal').forEach(button => {
      const modal = button.closest('.modal');
      button.addEventListener('click', () => {
        if (modal) {
          this.close(modal.id);
        }
      });
    });
    
    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close(modal.id);
        }
      });
    });
    
    // Tecla ESC para fechar modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.active');
        if (openModal) {
          this.close(openModal.id);
        }
      }
    });
  },
  
  /**
   * Abre um modal específico
   * @param {string} modalId - ID do modal
   */
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevenir scroll de fundo
    }
  },
  
  /**
   * Fecha um modal específico
   * @param {string} modalId - ID do modal
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = ''; // Restaurar scroll
    }
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

/**
 * Função de inicialização que roda quando o DOM está pronto
 */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar componentes
  ThemeManager.init();
  MobileNav.init();
  Toast.init();
  Modal.init();
  Newsletter.init();
  
  console.log('Curumim News - Inicializado com sucesso');
}); 