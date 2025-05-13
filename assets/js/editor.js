/**
 * Curumim News - Editor WYSIWYG
 * Gerenciamento do editor e upload de imagens
 */

import api from './api.js';
import { Utils, Toast, Modal, Loader } from './main.js';

// Variáveis globais
let quillEditor;    // Instância do editor Quill
let editorMode;     // 'create' ou 'edit'
let editorType;     // 'post' ou 'curiosidade'
let editorId;       // ID do item em edição (se aplicável)
let currentImagePath; // Caminho da imagem atual no storage (se aplicável)

/**
 * Inicializa o Editor Quill para WYSIWYG
 * @param {string} containerSelector - Seletor do DIV container do editor
 * @param {string} textareaSelector - Seletor do textarea oculto para sincronização
 * @param {string} placeholderText - Texto de placeholder para o editor
 */
const initQuillEditor = (containerSelector, textareaSelector, placeholderText) => {
  if (!document.querySelector(containerSelector)) return;
  
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
  quillEditor = new Quill(containerSelector, {
    modules: {
      toolbar: toolbarOptions
    },
    theme: 'snow',
    placeholder: placeholderText || 'Comece a escrever o conteúdo aqui...'
  });

  // Quando o conteúdo do editor mudar, atualize o textarea oculto
  // para que os dados sejam enviados com o formulário
  quillEditor.on('text-change', function() {
    const targetTextarea = document.querySelector(textareaSelector);
    if (targetTextarea) {
      targetTextarea.value = quillEditor.root.innerHTML;
    }
  });

  // Personalizar handler de imagem para usar nosso uploader
  // Nota: O handler de imagem será compartilhado. Se precisar de comportamento diferente por tipo,
  // isso precisaria de mais lógica aqui ou um handler separado.
  const toolbar = quillEditor.getModule('toolbar');
  toolbar.addHandler('image', function() {
    selectLocalImage(); // selectLocalImage pode precisar de contexto se o upload for para pastas diferentes
  });

  console.log(`Editor Quill inicializado para ${containerSelector}`);
};

/**
 * Handler para selecionar imagem local para o editor Quill
 */
const selectLocalImage = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    
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
    
    // Mostrar loader
    Loader.show('Enviando imagem...');
    
    try {
      // Fazer upload
      const result = await api.storage.uploadImage(file, 'editor', null);
      
      if (result.success) {
        // Inserir a imagem no editor
        const range = quillEditor.getSelection();
        quillEditor.insertEmbed(range.index, 'image', result.url);
        
        // Mover o cursor após a imagem
        quillEditor.setSelection(range.index + 1);
        
        Toast.show('Imagem inserida com sucesso!', 'success');
      } else {
        Toast.show(`Erro ao enviar imagem: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Erro no upload de imagem para o editor:', error);
      Toast.show('Ocorreu um erro ao enviar a imagem. Tente novamente.', 'error');
    } finally {
      Loader.hide();
    }
  };
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
      const curiosidadeTextoValor = item.texto || '';
      document.getElementById('curiosidade-texto').value = curiosidadeTextoValor;
      // Popular o editor Quill para curiosidades se ele estiver ativo
      if (quillEditor && editorType === 'curiosidade') {
        quillEditor.root.innerHTML = curiosidadeTextoValor;
      }
      
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
    }
    
    // Atualizar contadores de caracteres
    const resumoTextarea = document.getElementById('post-resumo');
    const resumoCounter = document.getElementById('resumo-counter');
    
    if (resumoTextarea && resumoCounter) {
      resumoCounter.textContent = resumoTextarea.value.length;
    }
    
    const curiosidadeTextarea = document.getElementById('curiosidade-texto');
    const curiosidadeCounter = document.getElementById('curiosidade-counter');
    
    if (curiosidadeTextarea && curiosidadeCounter) {
      curiosidadeCounter.textContent = curiosidadeTextarea.value.length;
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
 * Inicializa o formulário de editor e seus eventos
 */
const initEditorForm = () => {
  const form = document.getElementById('editor-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Impede o envio padrão do formulário
      
      // Validar o formulário
      if (!validateEditorForm()) {
        return;
      }
      
      // Mostrar loader
      Loader.show('Salvando...');
      
      try {
        // Coletar dados do formulário
        const formData = collectFormData();
        
        // Log para debug
        console.log('Dados do formulário:', formData);
        
        // Determinar o endpoint correto com base no tipo de conteúdo
        const endpoint = editorType === 'post' ? 'posts' : 'curiosidades';
        
        // Enviar dados para a API
        let response;
        
        if (editorMode === 'create') {
          // Criar novo conteúdo
          response = await api.data.create(endpoint, formData);
        } else {
          // Atualizar conteúdo existente
          response = await api.data.update(endpoint, editorId, formData);
        }
        
        // Verificar se a operação foi bem-sucedida
        if (response.success) {
          Toast.show(
            editorMode === 'create'
              ? `${editorType === 'post' ? 'Notícia' : 'Curiosidade'} criada com sucesso!`
              : `${editorType === 'post' ? 'Notícia' : 'Curiosidade'} atualizada com sucesso!`,
            'success'
          );
          
          // Redirecionar após um pequeno delay
          setTimeout(() => {
            window.location.href = `/admin/dashboard.html?tab=${editorType === 'post' ? 'noticias' : 'curiosidades'}-tab`;
          }, 1500);
        } else {
          throw new Error(response.error || 'Erro desconhecido');
        }
      } catch (error) {
        console.error('Erro ao salvar:', error);
        Toast.show(`Erro ao salvar: ${error.message}`, 'error');
      } finally {
        Loader.hide();
      }
    });
    
    // Evento de cancelar
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
      btnCancelar.addEventListener('click', () => {
        // Se houver alterações não salvas, mostrar confirmação
        if (formHasChanges()) {
          Modal.confirm(
            'Existem alterações não salvas. Deseja realmente sair?',
            () => {
              // Redirecionar para o dashboard
              window.location.href = `/admin/dashboard.html?tab=${editorType === 'post' ? 'noticias' : 'curiosidades'}-tab`;
            }
          );
        } else {
          // Redirecionar diretamente
          window.location.href = `/admin/dashboard.html?tab=${editorType === 'post' ? 'noticias' : 'curiosidades'}-tab`;
        }
      });
    }
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
    const textoHtml = document.getElementById('curiosidade-texto').value.trim(); // Conteúdo HTML do Quill
    const data = document.getElementById('curiosidade-data').value;
    
    if (!textoHtml || textoHtml === '<p><br></p>') {
      Toast.show('O texto da curiosidade é obrigatório.', 'error');
      isValid = false;
    } 
    // A validação de limite de caracteres foi removida para simplificar,
    // já que o contador visual também foi removido.
    // Se precisar reimplementar, usar quillEditor.getText().length.
    // else if (quillEditor && editorType === 'curiosidade') {
    //   const textoSimples = quillEditor.getText().trim();
    //   if (textoSimples.length > 500) {
    //     Toast.show('O texto da curiosidade deve ter no máximo 500 caracteres visíveis.', 'error');
    //     isValid = false;
    //   }
    // }
    
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
      initQuillEditor('#editor-container', '#post-corpo', 'Comece a escrever a notícia aqui...');
      initSlugGenerator();
      initImageUpload(); // initImageUpload usa editorType para o caminho do upload.
    } else if (editorType === 'curiosidade') {
      postForm.classList.add('hidden');
      curiosidadeForm.classList.remove('hidden');
      initQuillEditor('#curiosidade-editor-container', '#curiosidade-texto', 'Digite a curiosidade aqui...');
    }
  }
  
  // Atualizar campos hidden do formulário
  const editorIdInput = document.getElementById('editor-id');
  const editorTypeInput = document.getElementById('editor-type');
  const editorModeInput = document.getElementById('editor-mode');
  
  if (editorIdInput) editorIdInput.value = editorId || '';
  if (editorTypeInput) editorTypeInput.value = editorType;
  if (editorModeInput) editorModeInput.value = editorMode;
  
  // Inicializa contadores de caracteres (agora apenas para resumo de post)
  initCharCounters();
  
  // Se estamos no modo edição, carregar dados
  if (editorMode === 'edit' && editorId) {
    await loadContentForEditing();
  } else {
    // Preencher data atual para nova publicação
    const dataInput = document.getElementById(editorType === 'post' ? 'post-data' : 'curiosidade-data');
    if (dataInput) {
      const now = new Date();
      const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      dataInput.value = isoString;
    }
  }
  
  // Inicializar formulário
  initEditorForm();
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('Editor.js - DOMContentLoaded');
  // Verificar se estamos na página de editor
  if (document.body.classList.contains('admin-editor')) {
    initEditorPage();
  }
}); 