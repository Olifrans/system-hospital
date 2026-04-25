// ===== CHATBOT SYSTEM =====
const Chatbot = {
    endpoint: '/api/chat',
    userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    currentProvider: null,
    availableProviders: [],
    initialized: false,
    
    async init() {
        if (this.initialized) return;
        
        console.log('🤖 Inicializando Chatbot...');
        
        try {
            await this.loadProviders();
            this.bindEvents();
            this.initialized = true;
            console.log('✅ Chatbot inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar chatbot:', error);
            this.setupFallback();
        }
    },
    
    async loadProviders() {
        try {
            console.log('📡 Carregando providers...');
            const response = await fetch(`${this.endpoint}/providers`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Providers recebidos:', data);
            
            if (data.success && data.data) {
                this.availableProviders = data.data.available || [];
                this.currentProvider = data.data.current || (this.availableProviders[0]?.id);
                
                this.updateProviderSelect();
                console.log(`✅ Providers carregados. Atual: ${this.currentProvider}`);
            } else {
                throw new Error('Resposta inválida da API');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar providers:', error);
            this.setupFallback();
        }
    },
    
    updateProviderSelect() {
        const select = document.getElementById('providerSelect');
        
        if (!select) {
            console.error('❌ Elemento providerSelect não encontrado!');
            return;
        }
        
        // Limpa opções existentes
        select.innerHTML = '';
        
        // Se não houver providers, mostra modo demo
        if (!this.availableProviders || this.availableProviders.length === 0) {
            const option = document.createElement('option');
            option.value = 'demo';
            option.textContent = '🔧 Modo Demo';
            option.selected = true;
            select.appendChild(option);
            this.currentProvider = 'demo';
            console.log('⚠️  Usando modo demo (sem providers configurados)');
            return;
        }
        
        // Adiciona providers disponíveis
        this.availableProviders.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.id;
            
            // Ícone baseado no provider
            const icons = {
                'openai': '🟢',
                'nvidia': '🔵',
                'deepseek': '🟡',
                'qwen': '🔴',
                'gemini': '🟣',
                'copilot': '🔷',
                'google': '🔶',
                'claude': '🟠',
                'demo': '🔧'
            };
            
            const icon = icons[provider.id] || '•';
            option.textContent = `${icon} ${provider.name}`;
            
            if (provider.id === this.currentProvider) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        console.log(`✅ Select atualizado. Provider atual: ${this.currentProvider}`);
    },
    
    setupFallback() {
        this.availableProviders = [{ id: 'demo', name: 'Modo Demo', available: true }];
        this.currentProvider = 'demo';
        this.updateProviderSelect();
        
        const select = document.getElementById('providerSelect');
        if (select) {
            select.title = 'Nenhum provider configurado - Usando modo demo';
        }
    },
    
    bindEvents() {
        // Input do chat
        const input = document.getElementById('chatbotInput');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            input.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            });
        }
        
        console.log('✅ Eventos vinculados');
    },
    
    async handleProviderChange(newProvider) {
        const select = document.getElementById('providerSelect');
        
        if (!select || !newProvider) {
            console.error('❌ Select ou provider inválido');
            return;
        }
        
        if (newProvider === this.currentProvider) {
            console.log('ℹ️  Provider já está selecionado');
            return;
        }
        
        console.log(`🔄 Trocando provider de ${this.currentProvider} para ${newProvider}`);
        
        // Desabilita select durante troca
        select.disabled = true;
        
        try {
            const response = await fetch(`${this.endpoint}/provider/switch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ provider: newProvider })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentProvider = newProvider;
                console.log(`✅ Provider alterado para: ${newProvider}`);
                
                // Mostra mensagem no chat
                const providerName = this.availableProviders.find(p => p.id === newProvider)?.name || newProvider;
                this.addMessage(`✅ **Provider alterado para:** ${providerName}\n\nAgora estou usando ${providerName} para responder suas perguntas.`, 'bot');
                
                showToast(`Provider alterado para ${providerName}`, 'success');
            } else {
                console.error('❌ Erro ao trocar provider:', data.error);
                showToast('Erro ao trocar provider: ' + data.error, 'error');
                // Reverte para o provider atual
                this.updateProviderSelect();
            }
        } catch (error) {
            console.error('❌ Erro de rede ao trocar provider:', error);
            showToast('Erro de conexão ao trocar provider', 'error');
            this.updateProviderSelect();
        } finally {
            if (select) {
                select.disabled = false;
            }
        }
    },
    
    async sendMessage(customMessage = null) {
        const input = document.getElementById('chatbotInput');
        const message = customMessage || input?.value.trim();
        
        if (!message) {
            console.warn('⚠️  Mensagem vazia');
            return;
        }
        
        console.log('📤 Enviando mensagem:', message);
        
        // Adiciona mensagem do usuário
        this.addMessage(message, 'user');
        
        // Limpa input
        if (input) {
            input.value = '';
            input.style.height = 'auto';
        }
        
        // Mostra typing
        this.showTyping(true);
        
        // Desabilita input
        if (input) input.disabled = true;
        
        try {
            const response = await fetch(`${this.endpoint}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': this.userId
                },
                body: JSON.stringify({
                    message: message,
                    context: this.getContext(),
                    provider: this.currentProvider
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📥 Resposta recebida:', data);
            
            if (data.success && data.data) {
                this.addMessage(data.data.message, 'bot', data.data.provider);
            } else {
                throw new Error(data.error || 'Resposta inválida');
            }
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            this.addMessage('❌ **Erro ao processar mensagem**\n\n' + error.message + '\n\nTente novamente ou verifique sua conexão.', 'bot');
        } finally {
            this.showTyping(false);
            if (input) {
                input.disabled = false;
                input.focus();
            }
        }
    },
    
    addMessage(content, role, provider = null) {
        const container = document.getElementById('chatbotMessages');
        
        if (!container) {
            console.error('❌ Container de mensagens não encontrado!');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        
        const avatar = role === 'bot' ? '🤖' : '👤';
        const time = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Formata o conteúdo (markdown simples)
        const formattedContent = this.formatMessage(content);
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div>
                <div class="message-content">${formattedContent}</div>
                <div class="message-time">${time}${provider ? ` • ${provider}` : ''}</div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        
        // Scroll para o final
        container.scrollTop = container.scrollHeight;
        
        console.log(`💬 Mensagem ${role} adicionada`);
    },
    
    formatMessage(text) {
        if (!text) return '';
        
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/•/g, '•')
            .replace(/\n/g, '<br>');
    },
    
    showTyping(show) {
        const typing = document.getElementById('chatbotTyping');
        
        if (!typing) {
            console.warn('⚠️  Elemento typing não encontrado');
            return;
        }
        
        typing.style.display = show ? 'flex' : 'none';
        
        if (show) {
            const container = document.getElementById('chatbotMessages');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    },
    
    getContext() {
        const activeSection = document.querySelector('.page-section.active');
        return {
            page: activeSection ? activeSection.id.replace('page-', '') : 'dashboard',
            hospital: 'Hospital Central São Lucas',
            role: 'administrador',
            timestamp: new Date().toISOString()
        };
    },
    
    async clearChat() {
        if (!confirm('Deseja limpar todo o histórico da conversa?')) {
            return;
        }
        
        console.log('🗑️  Limpando chat...');
        
        try {
            await fetch(`${this.endpoint}/history?userId=${this.userId}`, {
                method: 'DELETE'
            });
            
            const container = document.getElementById('chatbotMessages');
            if (container) {
                container.innerHTML = `
                    <div class="chat-message bot">
                        <div class="message-content">
                            ✅ **Conversa limpa!**<br><br>
                            Como posso ajudar você agora? 🏥
                        </div>
                    </div>
                `;
            }
            
            console.log('✅ Chat limpo com sucesso');
        } catch (error) {
            console.error('❌ Erro ao limpar chat:', error);
            showToast('Erro ao limpar conversa', 'error');
        }
    }
};

// ===== FUNÇÕES GLOBAIS =====
function toggleChatbot() {
    const panel = document.getElementById('chatbotPanel');
    const overlay = document.getElementById('chatbotOverlay');
    
    if (!panel || !overlay) {
        console.error('❌ Elementos do chatbot não encontrados!');
        return;
    }
    
    const isActive = panel.classList.contains('active');
    
    if (isActive) {
        panel.classList.remove('active');
        overlay.classList.remove('active');
        console.log('🔽 Chatbot fechado');
    } else {
        panel.classList.add('active');
        overlay.classList.add('active');
        console.log('🔼 Chatbot aberto');
        
        // Foca no input após abrir
        setTimeout(() => {
            const input = document.getElementById('chatbotInput');
            if (input) input.focus();
        }, 300);
    }
}

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        Chatbot.sendMessage();
    }
}

function sendChatMessage() {
    Chatbot.sendMessage();
}

function clearChat() {
    Chatbot.clearChat();
}

function handleProviderChange(provider) {
    Chatbot.handleProviderChange(provider);
}

function showToast(message, type = 'info') {
    // Verifica se já existe container
    let container = document.getElementById('toastContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, inicializando chatbot...');
    
    // Aguarda um pouco para garantir que todo HTML foi renderizado
    setTimeout(() => {
        Chatbot.init();
    }, 100);
});

// Re-inicializa se o DOM mudar (para SPAs)
if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                const chatbotPanel = document.getElementById('chatbotPanel');
                if (chatbotPanel && !Chatbot.initialized) {
                    Chatbot.init();
                }
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}