# Plano de Ação: Widget de Clima e Cotação do Dólar

## Problemas Identificados

### Widget de Clima Atual:
- ❌ API do OpenWeatherMap não está funcionando corretamente
- ❌ Cidades só mudam ao clicar no widget
- ❌ Não há opção para esconder/mostrar o widget
- ❌ Widget é fixo na tela (position: fixed)
- ❌ Falta integração com API de cotação do dólar

## Objetivos

1. **Corrigir funcionamento da API de clima**
2. **Implementar rotação automática das cidades**
3. **Adicionar controle de visibilidade (mostrar/esconder)**
4. **Integrar API de cotação do dólar**
5. **Melhorar UX do widget**

---

## 📋 Passos de Implementação

### Fase 1: Análise e Preparação
- [x] **Passo 1**: Analisar código atual do widget de clima
- [x] **Passo 2**: Identificar problemas na API OpenWeatherMap
- [x] **Passo 3**: Mapear estrutura HTML e CSS do widget

### Fase 2: Correções do Widget de Clima
- [x] **Passo 4**: Corrigir/atualizar chave da API de clima
- [x] **Passo 5**: Implementar tratamento de erros robusto
- [x] **Passo 6**: Adicionar sistema de cache para evitar muitas requisições
- [x] **Passo 7**: Implementar rotação automática de cidades

### Fase 3: Controles de Visibilidade
- [x] **Passo 8**: Adicionar botão de fechar widget
- [x] **Passo 9**: Implementar persistência do estado (localStorage)
- [x] **Passo 10**: Criar botão para reabrir widget quando oculto

### Fase 4: Integração da Cotação do Dólar
- [x] **Passo 11**: Integrar API AwesomeAPI para cotação USD/BRL
- [x] **Passo 12**: Implementar alternância entre modo clima e dólar
- [x] **Passo 13**: Criar interface visual para cotação (ícones, cores)
- [x] **Passo 14**: Adicionar indicadores de alta/baixa do dólar

### Fase 5: Melhorias de UX
- [x] **Passo 15**: Redesign visual do widget (mais moderno)
- [x] **Passo 16**: Adicionar animações de transição
- [x] **Passo 17**: Implementar tooltips informativos
- [x] **Passo 18**: Otimizar para dispositivos móveis

### Fase 6: Testes e Finalização
- [x] **Passo 19**: Testar todas as funcionalidades
- [x] **Passo 20**: Verificar compatibilidade entre navegadores
- [x] **Passo 21**: Documentar novas funcionalidades
- [ ] **Passo 22**: Atualizar README com instruções

---

## ✅ Resumo das Melhorias Implementadas

### 🌤️ Widget de Clima Corrigido
- **API OpenWeatherMap**: Implementado sistema de retry com 3 tentativas
- **Cache inteligente**: Evita requisições desnecessárias (1 minuto de cache)
- **Rotação automática**: Cidades da região Norte alternam a cada 30 segundos
- **Tratamento de erros**: Mensagens informativas e retry automático

### 💰 Integração da Cotação do Dólar
- **API AwesomeAPI**: Cotação USD/BRL em tempo real
- **Indicadores visuais**: Ícones de alta/baixa baseados na variação
- **Cache otimizado**: Atualização a cada 5 minutos
- **Informações completas**: Valor, variação percentual, alta e baixa do dia

### 🎛️ Controles Avançados
- **Alternância de modos**: Clique no widget alterna entre clima e dólar
- **Botão de fechar**: Permite ocultar o widget temporariamente
- **Persistência**: Estado salvo no localStorage do navegador
- **Botão de reabrir**: Ícone animado para reexibir o widget
- **Indicador de modo**: Mostra se está exibindo clima ou dólar

### 🎨 Design Moderno
- **Visual glassmorphism**: Fundo translúcido com blur
- **Animações suaves**: Transições e efeitos hover
- **Responsividade**: Otimizado para desktop, tablet e mobile
- **Gradientes**: Efeitos visuais modernos
- **Micro-interações**: Feedback visual para todas as ações

### 📱 Compatibilidade
- **Cross-browser**: Funciona em Chrome, Firefox, Safari, Edge
- **Mobile-first**: Design responsivo para todos os dispositivos
- **Performance**: Otimizado para carregamento rápido
- **Acessibilidade**: Tooltips e textos alternativos

---

## APIs a Serem Utilizadas

### Clima
- **OpenWeatherMap**: `https://api.openweathermap.org/data/2.5/weather`
- **Alternativa**: WeatherAPI ou AccuWeather

### Cotação do Dólar
- **AwesomeAPI**: `https://economia.awesomeapi.com.br/last/USD-BRL`
- **Alternativa**: Fixer.io ou ExchangeRate-API

---

## Estrutura do Novo Widget

```
┌─────────────────────────┐
│  [≡] Widget Clima/Dólar │
├─────────────────────────┤
│ 🌤️ Manaus, AM          │
│    25°C - Ensolarado    │
├─────────────────────────┤
│ 💵 USD/BRL             │
│    R$ 5,23 (+0,15%)     │
├─────────────────────────┤
│ [◀] [●●○○○○○] [▶]      │
│ Atualizado há 2min      │
└─────────────────────────┘
```

---

## Cronograma Estimado

- **Passos 1-3**: 1 dia
- **Passos 4-6**: 2 dias  
- **Passos 7-9**: 1 dia
- **Total**: 4 dias de desenvolvimento

---

## Notas Técnicas

- Manter compatibilidade com todas as páginas existentes
- Usar MCP do Supabase quando necessário para otimizações
- Implementar tratamento de erro robusto
- Seguir padrões de código existentes no projeto
- Priorizar performance e UX

---

**Última atualização**: $(date)
**Status**: Em andamento
**Responsável**: Capitão Henrique