/**
 * Curumim News - API Service
 * Wrapper para as chamadas à API do Supabase
 */

// Importação da biblioteca do Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

// Configuração do cliente Supabase
const supabaseUrl = 'https://xfebrmjrepfaewnkygzr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZWJybWpyZXBmYWV3bmt5Z3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1Nzg5OTEsImV4cCI6MjA2MjE1NDk5MX0.DJGVuPp0-vfeH6OfRh3CEwxdmvh4l7x8P8cZICPDDlc';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Serviço de API para interagir com o Supabase
 */
const api = {
  /**
   * Autenticação e Usuários
   */
  auth: {
    /**
     * Realiza login com email e senha
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Promise} Resultado da operação
     */
    login: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Erro ao fazer login:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Realiza logout do usuário atual
     * @returns {Promise} Resultado da operação
     */
    logout: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtém dados do usuário atual
     * @returns {Promise} Dados do usuário ou null
     */
    getCurrentUser: async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
      } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
        return null;
      }
    },

    /**
     * Verifica se o usuário está autenticado
     * @returns {Promise<boolean>} Verdadeiro se o usuário estiver autenticado
     */
    isAuthenticated: async () => {
      const user = await api.auth.getCurrentUser();
      return user !== null;
    },

    /**
     * Envia email para recuperação de senha
     * @param {string} email - Email do usuário
     * @returns {Promise} Resultado da operação
     */
    recoverPassword: async (email) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Erro ao enviar recuperação de senha:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Altera a senha do usuário autenticado
     * @param {string} password - Nova senha
     * @returns {Promise} Resultado da operação
     */
    updatePassword: async (password) => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Atualiza os dados do perfil do usuário autenticado
     * @param {Object} data - Dados do perfil (name, etc)
     * @returns {Promise} Resultado da operação
     */
    updateProfile: async (data) => {
      try {
        const { error } = await supabase.auth.updateUser({
          data: data
        });
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return { success: false, error: error.message };
      }
    }
  },

  /**
   * Operações com Notícias
   */
  posts: {
    /**
     * Obtém lista de notícias com paginação
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {string} filter - Filtro opcional por categoria
     * @returns {Promise} Resultado da operação com dados
     */
    getList: async (page = 1, limit = 6, filter = null) => {
      try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        let query = supabase
          .from('posts')
          .select('*', { count: 'exact' })
          .order('data_publicacao', { ascending: false });
          
        if (filter && filter !== 'all') {
          query = query.eq('categoria', filter);
        }
        
        const { data, error, count } = await query.range(from, to);
        
        if (error) throw error;
        
        return { 
          success: true, 
          data, 
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        };
      } catch (error) {
        console.error('Erro ao buscar notícias:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Busca notícias por termo de pesquisa
     * @param {string} searchTerm - Termo para busca
     * @param {number} limit - Limite de resultados
     * @returns {Promise} Resultado da operação com dados
     */
    search: async (searchTerm, limit = 20) => {
      try {
        if (!searchTerm || searchTerm.trim() === '') {
          return await api.posts.getList(1, limit);
        }
        
        // Busca por título, resumo ou corpo
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .or(`titulo.ilike.%${searchTerm}%,resumo.ilike.%${searchTerm}%,corpo.ilike.%${searchTerm}%`)
          .order('data_publicacao', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        
        return { 
          success: true, 
          data, 
          searchTerm
        };
      } catch (error) {
        console.error(`Erro ao buscar notícias com termo "${searchTerm}":`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtém notícias em destaque
     * @param {number} limit - Número de destaques a retornar
     * @returns {Promise} Resultado da operação com dados
     */
    getFeatured: async (limit = 5) => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('destaque', true)
          .order('data_publicacao', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Erro ao buscar destaques:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtém uma notícia específica pelo slug
     * @param {string} slug - Slug da notícia
     * @returns {Promise} Resultado da operação com dados
     */
    getBySlug: async (slug) => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error(`Erro ao buscar notícia com slug ${slug}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtém uma notícia pelo ID
     * @param {number} id - ID da notícia
     * @returns {Promise} Resultado da operação com dados
     */
    getById: async (id) => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error(`Erro ao buscar notícia com ID ${id}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Cria uma nova notícia
     * @param {object} post - Dados da notícia
     * @returns {Promise} Resultado da operação
     */
    create: async (post) => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .insert([post])
          .select();
          
        if (error) throw error;
        return { success: true, data: data[0] };
      } catch (error) {
        console.error('Erro ao criar notícia:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Atualiza uma notícia existente
     * @param {number} id - ID da notícia
     * @param {object} post - Dados atualizados
     * @returns {Promise} Resultado da operação
     */
    update: async (id, post) => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .update(post)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
      } catch (error) {
        console.error(`Erro ao atualizar notícia com ID ${id}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Deleta uma notícia existente
     * @param {number} id - ID da notícia
     * @returns {Promise} Resultado da operação
     */
    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error(`Erro ao deletar notícia com ID ${id}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Busca notícias relacionadas 
     * @param {string} currentSlug - Slug da notícia atual para excluir dos resultados
     * @param {string} categoria - Categoria para filtrar notícias relacionadas
     * @param {number} limit - Limite de itens
     * @returns {Promise} Resultado da operação com dados
     */
    getRelated: async (currentSlug, categoria, limit = 3) => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('categoria', categoria)
          .neq('slug', currentSlug)
          .order('data_publicacao', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error('Erro ao buscar notícias relacionadas:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtém todas as notícias (sem paginação, para admin)
     * @returns {Promise} Resultado da operação com dados
     */
    getAllPosts: async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('data_publicacao', { ascending: false });
        if (error) throw error;
        return data; // Retorna diretamente os dados para admin.js
      } catch (error) {
        console.error('Erro ao buscar todas as notícias:', error);
        throw error; // Propaga o erro para ser tratado no admin.js
      }
    }
  },

  /**
   * Operações com Curiosidades
   */
  curiosidades: {
    /**
     * Obtém lista de curiosidades com paginação
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {string} sortOrder - Ordem de classificação (newest/oldest)
     * @returns {Promise} Resultado da operação com dados
     */
    getList: async (page = 1, limit = 10, sortOrder = 'newest') => {
      try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        const { data, error, count } = await supabase
          .from('curiosidades')
          .select('*', { count: 'exact' })
          .order('data', { ascending: sortOrder === 'oldest' })
          .range(from, to);
          
        if (error) throw error;
        
        return { 
          success: true, 
          data, 
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        };
      } catch (error) {
        console.error('Erro ao buscar curiosidades:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Busca curiosidades por termo de pesquisa
     * @param {string} searchTerm - Termo para busca
     * @param {number} limit - Limite de resultados
     * @returns {Promise} Resultado da operação com dados
     */
    search: async (searchTerm, limit = 20) => {
      try {
        if (!searchTerm || searchTerm.trim() === '') {
          return await api.curiosidades.getList(1, limit);
        }
        
        // Busca por texto da curiosidade
        const { data, error } = await supabase
          .from('curiosidades')
          .select('*')
          .ilike('texto', `%${searchTerm}%`)
          .order('data', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        
        return { 
          success: true, 
          data, 
          searchTerm
        };
      } catch (error) {
        console.error(`Erro ao buscar curiosidades com termo "${searchTerm}":`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtém uma curiosidade pelo ID
     * @param {number} id - ID da curiosidade
     * @returns {Promise} Resultado da operação com dados
     */
    getById: async (id) => {
      try {
        const { data, error } = await supabase
          .from('curiosidades')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        console.error(`Erro ao buscar curiosidade com ID ${id}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Cria uma nova curiosidade
     * @param {object} curiosidade - Dados da curiosidade
     * @returns {Promise} Resultado da operação
     */
    create: async (curiosidade) => {
      try {
        const { data, error } = await supabase
          .from('curiosidades')
          .insert([curiosidade])
          .select();
          
        if (error) throw error;
        return { success: true, data: data[0] };
      } catch (error) {
        console.error('Erro ao criar curiosidade:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Atualiza uma curiosidade existente
     * @param {number} id - ID da curiosidade
     * @param {object} curiosidade - Dados atualizados
     * @returns {Promise} Resultado da operação
     */
    update: async (id, curiosidade) => {
      try {
        const { data, error } = await supabase
          .from('curiosidades')
          .update(curiosidade)
          .eq('id', id)
          .select();
          
        if (error) throw error;
        return { success: true, data: data[0] };
      } catch (error) {
        console.error(`Erro ao atualizar curiosidade ${id}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Remove uma curiosidade
     * @param {number} id - ID da curiosidade
     * @returns {Promise} Resultado da operação
     */
    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('curiosidades')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error(`Erro ao excluir curiosidade ${id}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Envia uma sugestão de curiosidade
     * @param {object} sugestao - Dados da sugestão
     * @returns {Promise} Resultado da operação
     */
    enviarSugestao: async (sugestao) => {
      try {
        const { data, error } = await supabase
          .from('sugestoes_curiosidades')
          .insert([sugestao]);
          
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Erro ao enviar sugestão:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtém lista de todas as curiosidades (para admin)
     * @returns {Promise} Resultado da operação com dados
     */
    getAllCuriosities: async () => {
      try {
        const { data, error } = await supabase
          .from('curiosidades')
          .select('*')
          .order('data', { ascending: false });
        if (error) throw error;
        return data; // Retorna diretamente os dados
      } catch (error) {
        console.error('Erro ao buscar todas as curiosidades:', error);
        throw error; 
      }
    }
  },

  /**
   * Operações de Storage
   */
  storage: {
    /**
     * Faz upload de uma imagem
     * @param {File} file - Arquivo para upload
     * @param {string} path - Caminho no storage
     * @param {Function} progressCallback - Callback para progresso do upload
     * @returns {Promise} Resultado da operação com URL pública
     */
    uploadImage: async (file, path, progressCallback) => {
      try {
        // Validar o tipo do arquivo
        if (!file.type.match(/image\/(jpeg|png|gif|webp)/)) {
          throw new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP.');
        }
        
        // Validar o tamanho (2MB máximo)
        if (file.size > 2 * 1024 * 1024) {
          throw new Error('Arquivo muito grande. O tamanho máximo permitido é 2MB.');
        }
        
        // Gerar nome único para o arquivo
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const fullPath = `${path}/${fileName}`;
        
        // Fazer upload
        const { data, error } = await supabase.storage
          .from('news-images')
          .upload(fullPath, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: progress => {
              if (progressCallback) {
                const percentage = (progress.loaded / progress.total) * 100;
                progressCallback(percentage);
              }
            }
          });
          
        if (error) throw error;
        
        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('news-images')
          .getPublicUrl(fullPath);
          
        return { 
          success: true, 
          path: fullPath,
          url: publicUrl
        };
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Remove uma imagem do storage
     * @param {string} path - Caminho completo da imagem
     * @returns {Promise} Resultado da operação
     */
    deleteImage: async (path) => {
      try {
        const { error } = await supabase.storage
          .from('news-images')
          .remove([path]);
          
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Erro ao excluir imagem:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Faz upload de um arquivo para um bucket específico.
     * @param {string} bucketName - Nome do bucket (ex: 'news-images').
     * @param {string} filePath - Caminho/nome do arquivo no bucket (ex: 'noticias/nome-arquivo.jpg').
     * @param {File} file - O objeto File a ser enviado.
     * @returns {Promise<{success: boolean, path?: string, error?: string}>}
     */
    uploadFile: async (bucketName, filePath, file) => {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600', // Opcional: tempo de cache em segundos
            upsert: true // Opcional: sobrescreve se o arquivo já existir
          });

        if (error) throw error;
        // data.path contém o caminho do arquivo no bucket.
        // Para obter a URL pública, usamos getFilePublicURL.
        return { success: true, path: data.path };
      } catch (error) {
        console.error(`Erro ao fazer upload do arquivo ${filePath} para o bucket ${bucketName}:`, error);
        return { success: false, error: error.message };
      }
    },

    /**
     * Obtém a URL pública de um arquivo no storage.
     * @param {string} bucketName - Nome do bucket.
     * @param {string} filePath - Caminho do arquivo no bucket.
     * @returns {{publicUrl: string | null, error?: string}}
     */
    getFilePublicURL: (bucketName, filePath) => {
        try {
            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            if (!data || !data.publicUrl) {
                 throw new Error('Não foi possível obter a URL pública.');
            }
            return { publicUrl: data.publicUrl };
        } catch(error) {
            console.error(`Erro ao obter URL pública do arquivo ${filePath} no bucket ${bucketName}:`, error);
            return { publicUrl: null, error: error.message };
        }
    },
    
    /**
     * Deleta um arquivo de um bucket.
     * @param {string} bucketName - Nome do bucket.
     * @param {string} filePath - Caminho do arquivo no bucket.
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    deleteFile: async (bucketName, filePath) => {
      try {
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);

        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error(`Erro ao deletar o arquivo ${filePath} do bucket ${bucketName}:`, error);
        return { success: false, error: error.message };
      }
    }
  },

  /**
   * Estatísticas para o Dashboard
   */
  stats: {
    /**
     * Obtém estatísticas gerais para o dashboard
     * @returns {Promise} Resultado da operação com dados
     */
    getDashboardStats: async () => {
      try {
        // Total de notícias
        const { count: totalNoticias, error: errorNoticias } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true });
          
        if (errorNoticias) throw errorNoticias;
        
        // Total de curiosidades
        const { count: totalCuriosidades, error: errorCuriosidades } = await supabase
          .from('curiosidades')
          .select('*', { count: 'exact', head: true });
          
        if (errorCuriosidades) throw errorCuriosidades;
        
        // Notícias deste mês
        const dataInicio = new Date();
        dataInicio.setDate(1); // Primeiro dia do mês atual
        
        const { count: noticiasNoMes, error: errorNoticiasNoMes } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .gte('data_publicacao', dataInicio.toISOString());
          
        if (errorNoticiasNoMes) throw errorNoticiasNoMes;
        
        // Curiosidades deste mês
        const { count: curiosidadesNoMes, error: errorCuriosidadesNoMes } = await supabase
          .from('curiosidades')
          .select('*', { count: 'exact', head: true })
          .gte('data', dataInicio.toISOString());
          
        if (errorCuriosidadesNoMes) throw errorCuriosidadesNoMes;

        // Contagem de visualizações (usando tabela de analytics se existir)
        let totalViews = 0;
        let viewsNoMes = 0;
        let viewsPercentual = 0;
        
        try {
          // Verificar se existe tabela de analytics
          const { count: totalViewsCount, error: viewsError } = await supabase
            .from('views')
            .select('*', { count: 'exact', head: true });
            
          if (!viewsError) {
            totalViews = totalViewsCount;
            
            // Views deste mês
            const { count: viewsNoMesCount } = await supabase
              .from('views')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', dataInicio.toISOString());
              
            viewsNoMes = viewsNoMesCount;
            viewsPercentual = totalViews > 0 ? (viewsNoMes / totalViews) * 100 : 0;
          }
        } catch (viewsErr) {
          console.log('Analytics table might not exist, using fallback:', viewsErr);
          // Se não existir, usa contagem básica baseada em posts (1 view mínimo por post)
          totalViews = totalNoticias * 5; // Simulação simples: média de 5 views por notícia
          viewsNoMes = noticiasNoMes * 8; // Simulação: posts recentes têm mais views (8 por post)
          viewsPercentual = 15; // Crescimento padrão de 15%
        }
        
        return { 
          success: true, 
          data: {
            posts: {
              total: totalNoticias,
              noMes: noticiasNoMes,
              percentualCrescimento: totalNoticias > 0 ? (noticiasNoMes / totalNoticias) * 100 : 0
            },
            curiosidades: {
              total: totalCuriosidades,
              noMes: curiosidadesNoMes,
              percentualCrescimento: totalCuriosidades > 0 ? (curiosidadesNoMes / totalCuriosidades) * 100 : 0
            },
            views: {
              total: totalViews,
              noMes: viewsNoMes,
              percentualCrescimento: viewsPercentual
            }
          }
        };
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return { success: false, error: error.message };
      }
    }
  },

  /**
   * Funções específicas do Admin (ex: estatísticas)
   */
  admin: {
    /**
     * Obtém estatísticas para o dashboard.
     * (Simulação, idealmente viria do backend/Supabase functions)
     * @returns {Promise<object>}
     */
    getStats: async () => {
      try {
        // Simulação de chamada à API ou função do Supabase
        // Em um cenário real, você faria queries para contar posts, curiosidades, etc.
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true });

        if (postsError) throw postsError;

        const { count: curiositiesCount, error: curiositiesError } = await supabase
          .from('curiosidades')
          .select('*', { count: 'exact', head: true });

        if (curiositiesError) throw curiositiesError;
        
        // Para views e users, seriam mais complexos ou tabelas dedicadas.
        // Por agora, vamos simular.
        return {
          posts: { total: postsCount || 0, percentChange: Math.floor(Math.random() * 10) },
          curiosities: { total: curiositiesCount || 0, percentChange: Math.floor(Math.random() * 5) },
          views: { total: Math.floor(Math.random() * 1000), percentChange: Math.floor(Math.random() * 20) },
          users: { total: 1, percentChange: 0 } // Considerando apenas 1 admin por enquanto
        };
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        // Retorna um objeto de stats padrão em caso de erro para não quebrar a UI
        return {
          posts: { total: 0, percentChange: 0 },
          curiosidades: { total: 0, percentChange: 0 },
          views: { total: 0, percentChange: 0 },
          users: { total: 1, percentChange: 0 }
        };
      }
    }
  }
};

export default api; 