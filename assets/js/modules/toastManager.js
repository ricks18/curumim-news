/**
 * Curumim News - Gerenciador de Notificações Toast
 */
const ToastManager = {
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
      }, 300); // Tempo da animação de fade-out
    });
    
    // Adiciona classe para animar a entrada
    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, 10); // Pequeno delay para garantir a transição CSS
    
    // Remove o toast após o tempo determinado
    const hideTimer = setTimeout(() => {
      toast.classList.add('toast-hiding');
      // Garante que o evento de clique seja removido para não causar erros se clicado durante a remoção
      closeButton.removeEventListener('click', closeButton.__handler__); 
      setTimeout(() => {
        toast.remove();
      }, 300); // Tempo da animação de fade-out
    }, duration);

    // Armazena a função handler para poder removê-la depois
    closeButton.__handler__ = () => {
        clearTimeout(hideTimer); // Cancela a remoção automática se fechado manualmente
        toast.classList.add('toast-hiding');
        setTimeout(() => {
            toast.remove();
        }, 300);
    };
    closeButton.addEventListener('click', closeButton.__handler__);
  }
  // Não é mais necessário um método init(), pois o container é criado sob demanda.
};

export default ToastManager; 