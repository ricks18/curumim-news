/**
 * Curumim News - JavaScript para o novo design
 * Implementado conforme especificação do projeto
 */

// Importação dos módulos existentes
import api from './api.js';
import { Utils, Toast, ThemeManager } from './main.js';

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  console.log('Curumim News - Interface moderna inicializada');
  initializeVoiceSearch();
  initializeWeatherWidget();
  initializeHeroSlider();
  setupCategoryFilters();
  initializeNewsLoading();
});

/**
 * Inicializa a funcionalidade de busca por voz
 */
function initializeVoiceSearch() {
  const voiceButton = document.querySelector('.voice-search');
  const searchInput = document.querySelector('.search-box input');
  
  if (!voiceButton || !searchInput) return;
  
  voiceButton.addEventListener('click', () => {
    // Verificar se o navegador suporta reconhecimento de voz
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      startVoiceRecognition(searchInput);
    } else {
      showToast('Seu navegador não suporta reconhecimento de voz', 'error');
    }
  });
}

/**
 * Inicia o reconhecimento de voz para busca
 */
function startVoiceRecognition(inputElement) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  const voiceButton = document.querySelector('.voice-search');
  
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onstart = () => {
    inputElement.placeholder = 'Ouvindo...';
    voiceButton.classList.add('listening');
    showToast('Fale agora...', 'info');
  };
  
  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    inputElement.value = speechResult;
    
    // Acionar busca
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
      searchButton.click();
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento de voz:', event.error);
    inputElement.placeholder = 'Pesquisar notícias...';
    voiceButton.classList.remove('listening');
    showToast('Não foi possível reconhecer sua voz', 'error');
  };
  
  recognition.onend = () => {
    inputElement.placeholder = 'Pesquisar notícias...';
    voiceButton.classList.remove('listening');
  };
  
  recognition.start();
}

/**
 * Inicializa o widget de clima para cidades do Norte do Brasil
 */
function initializeWeatherWidget() {
  // Lista de cidades do Norte do Brasil com latitude e longitude
  const cidadesNorte = [
    { nome: 'Manaus', uf: 'AM', lat: -3.1190, lon: -60.0217 },
    { nome: 'Belém', uf: 'PA', lat: -1.4558, lon: -48.5044 },
    { nome: 'Porto Velho', uf: 'RO', lat: -8.7608, lon: -63.9088 },
    { nome: 'Macapá', uf: 'AP', lat: 0.0356, lon: -51.0705 },
    { nome: 'Rio Branco', uf: 'AC', lat: -9.9754, lon: -67.8249 },
    { nome: 'Boa Vista', uf: 'RR', lat: 2.8235, lon: -60.6758 },
    { nome: 'Palmas', uf: 'TO', lat: -10.2491, lon: -48.3243 }
  ];
  
  let cidadeAtual = 0;
  const weatherWidget = document.querySelector('.weather-widget');
  if (!weatherWidget) return;
  
  // Função para buscar dados do clima
  const fetchWeatherData = async () => {
    try {
      // Adicionar status de carregamento
      weatherWidget.querySelector('.weather-loading').textContent = 'Carregando...';
      
      // Seleção da cidade atual
      const cidade = cidadesNorte[cidadeAtual];
      
      // Usando a API OpenWeatherMap
      const apiKey = '7f9f27957bd1002f6def80e53eb9d828'; // Use sua própria chave em produção
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${cidade.lat}&lon=${cidade.lon}&units=metric&lang=pt_br&appid=${apiKey}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados climáticos: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Atualizar widget com os dados recebidos
      const iconCode = data.weather[0].icon;
      const temperatura = Math.round(data.main.temp);
      
      // Atualizar conteúdo do widget
      const tempElement = weatherWidget.querySelector('.weather-temp');
      const iconElement = weatherWidget.querySelector('.weather-icon');
      
      if (tempElement) {
        tempElement.textContent = `${temperatura}°C`;
      }
      
      if (iconElement) {
        iconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconElement.alt = data.weather[0].description;
      }
      
      // Adicionar tooltip com informações adicionais
      weatherWidget.setAttribute('title', `${cidade.nome}, ${cidade.uf}: ${data.weather[0].description}`);
      weatherWidget.querySelector('.weather-loading').textContent = cidade.nome;
      
      // Avança para a próxima cidade para a próxima atualização
      cidadeAtual = (cidadeAtual + 1) % cidadesNorte.length;
      
    } catch (error) {
      console.error('Erro no widget de clima:', error);
      showToast('Não foi possível atualizar o clima', 'error');
      weatherWidget.querySelector('.weather-loading').textContent = 'Erro';
    }
  };
  
  // Inicializa com a primeira cidade
  fetchWeatherData();
  
  // Configurar atualização a cada 1 minuto (60000ms)
  setInterval(fetchWeatherData, 60000);
  
  // Adicionar evento de clique para atualização manual
  weatherWidget.addEventListener('click', () => {
    fetchWeatherData();
    showToast('Atualizando informações climáticas...', 'info');
  });
}

/**
 * Inicializa o slider de notícias em destaque
 */
function initializeHeroSlider() {
  const heroSection = document.querySelector('.hero-section');
  if (!heroSection) return;
  
  const prevButton = heroSection.querySelector('.hero-control.prev');
  const nextButton = heroSection.querySelector('.hero-control.next');
  const indicators = heroSection.querySelectorAll('.indicator');
  
  if (prevButton && nextButton && indicators.length > 0) {
    // Configurar navegação do destaque
    // Em implementação completa, isso incluiria rotação de múltiplos destaques
    
    // Evento para anterior
    prevButton.addEventListener('click', () => {
      showToast('Notícia anterior', 'info');
    });
    
    // Evento para próxima
    nextButton.addEventListener('click', () => {
      showToast('Próxima notícia', 'info');
    });
    
    // Evento para indicadores
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        // Atualizar classes ativas
        indicators.forEach(ind => ind.classList.remove('active'));
        indicator.classList.add('active');
        
        showToast(`Notícia ${index + 1}`, 'info');
      });
    });
  }
}

/**
 * Configura os filtros de categoria para notícias
 */
function setupCategoryFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  if (!filterButtons.length) return;
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remover classe active de todos os botões
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Adicionar classe active ao botão clicado
      button.classList.add('active');
      
      const category = button.getAttribute('data-category');
      console.log(`Filtrando por categoria: ${category}`);
      
      // Mostrar mensagem informativa
      const categoryName = category === 'all' ? 'todas as categorias' : category;
      showToast(`Mostrando notícias de ${categoryName}`, 'info');
    });
  });
}

/**
 * Inicializa o carregamento de notícias
 */
function initializeNewsLoading() {
  const loadMoreButton = document.getElementById('load-more');
  const newsContainer = document.getElementById('news-container');
  const newsLoading = document.getElementById('news-loading');

  if (loadMoreButton && newsContainer) {
    loadMoreButton.addEventListener('click', () => {
      // Simulando carregamento
      showToast('Carregando mais notícias...', 'info');
      
      // Depois de "carregar", esconde o loader
      if (newsLoading) {
        newsLoading.style.display = 'none';
      }
    });
  }
}

/**
 * Exibe um toast com a mensagem fornecida
 */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  // Remover classes anteriores e adicionar tipo
  toast.className = 'toast';
  toast.classList.add(type);
  
  toast.textContent = message;
  toast.classList.add('active');
  
  // Remover após 3 segundos
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
} 