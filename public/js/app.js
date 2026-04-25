// ===== NAVEGAÇÃO =====
function navigateTo(page, el) {
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');

    // Atualizar páginas
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById('page-' + page)?.classList.add('active');

    // Atualizar header
    const titles = {
        dashboard: ['Dashboard', 'Visão geral do sistema hospitalar'],
        patients: ['Pacientes', 'Gerenciamento de pacientes cadastrados'],
        appointments: ['Consultas', 'Agendamento e controle de consultas'],
        // ... outros
    };

    document.getElementById('pageTitle').textContent = titles[page]?.[0] || 'Dashboard';
    document.getElementById('pageSubtitle').textContent = titles[page]?.[1] || '';

    // Fechar sidebar mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
}

// ===== SIDEBAR =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

// ===== UTILITÁRIOS =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados iniciais via API (exemplo)
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('Sistema online:', data);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro de conexão com o servidor', 'error');
    }
}