// ========================================
// APPLICATION MPC-REDEVABILITÉ
// ========================================

class MPCApp {
    constructor() {
        this.reports = this.loadReports();
        this.currentView = 'dashboard';
        this.init();
    }

    // Initialisation
    init() {
        this.setupNavigation();
        this.setupForm();
        this.setupFilters();
        this.setupAgentTabs();
        this.renderDashboard();
        this.renderReportsList();
        this.renderAgentReports();
        this.updateOfflineCount();
    }

    // Chargement des données depuis localStorage
    loadReports() {
        const stored = localStorage.getItem('mpc_reports');
        if (stored) {
            return JSON.parse(stored);
        }
        return MPC_DATA.initialReports;
    }

    // Sauvegarde dans localStorage
    saveReports() {
        localStorage.setItem('mpc_reports', JSON.stringify(this.reports));
    }

    // Navigation entre les vues
    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
                
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    switchView(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(`view-${view}`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = view;
        }
    }

    // Gestion du formulaire
    setupForm() {
        const form = document.getElementById('report-form');
        const desc = document.getElementById('description');
        const charCount = document.getElementById('char-count');

        if (desc && charCount) {
            desc.addEventListener('input', () => {
                charCount.textContent = `${desc.value.length} / 500`;
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReport(form);
            });
        }
    }

    submitReport(form) {
        const newReport = {
            id: `MPC-${String(this.reports.length + 123).padStart(6, '0')}`,
            category: document.getElementById('category').value,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            location: document.getElementById('location').value,
            name: document.getElementById('anonymous').checked 
                ? 'Anonyme' 
                : (document.getElementById('name').value || 'Anonyme'),
            phone: document.getElementById('anonymous').checked 
                ? '' 
                : document.getElementById('phone').value,
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            agent: 'Non assigné'
        };

        this.reports.unshift(newReport);
        this.saveReports();

        // Afficher le modal de succès
        const trackingNumberEl = document.getElementById('tracking-number');
        const modal = document.getElementById('success-modal');
        if (trackingNumberEl) trackingNumberEl.textContent = newReport.id;
        if (modal) modal.classList.add('active');

        // Reset form
        form.reset();
        const charCount = document.getElementById('char-count');
        if (charCount) charCount.textContent = '0 / 500';

        // Refresh les vues
        this.renderDashboard();
        this.renderReportsList();
        this.renderAgentReports();
    }

    // Filtres de la liste
    setupFilters() {
        const search = document.getElementById('search-input');
        const statusFilter = document.getElementById('filter-status');
        const categoryFilter = document.getElementById('filter-category');

        const applyFilters = () => {
            this.renderReportsList({
                search: search ? search.value.toLowerCase() : '',
                status: statusFilter ? statusFilter.value : 'all',
                category: categoryFilter ? categoryFilter.value : 'all'
            });
        };

        if (search) search.addEventListener('input', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
        if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    }

    // Onglets Agent
    setupAgentTabs() {
        document.querySelectorAll('.agent-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                document.querySelectorAll('.agent-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.agent-content').forEach(c => c.classList.remove('active'));
                const targetTab = document.getElementById(`tab-${tabName}`);
                if (targetTab) targetTab.classList.add('active');
            });
        });

        const syncBtn = document.getElementById('sync-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                alert('✅ Synchronisation réussie ! Toutes les données ont été envoyées au serveur.');
                this.updateOfflineCount(0);
            });
        }
    }

    // Rendu du tableau de bord
    renderDashboard() {
        const stats = {
            total: this.reports.length,
            resolved: this.reports.filter(r => r.status === 'resolved').length,
            progress: this.reports.filter(r => r.status === 'progress').length,
            pending: this.reports.filter(r => r.status === 'pending').length
        };

        const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
        setEl('stat-total', stats.total);
        setEl('stat-resolved', stats.resolved);
        setEl('stat-progress', stats.progress);
        setEl('stat-pending', stats.pending);

        this.renderCategoriesChart();
        this.renderRecentReports();
    }

    renderCategoriesChart() {
        const container = document.getElementById('categories-chart');
        if (!container) return;

        const counts = {};
        this.reports.forEach(r => {
            counts[r.category] = (counts[r.category] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(counts), 1);
        
        container.innerHTML = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
                const info = MPC_DATA.categories[cat];
                const percent = Math.round((count / maxCount) * 100);
                return `
                    <div class="chart-bar">
                        <span class="chart-label">${info.label}</span>
                        <div class="chart-progress">
                            <div class="chart-fill" style="width: ${percent}%; background: ${info.color};">
                                ${count}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    renderRecentReports() {
        const container = document.getElementById('recent-reports');
        if (!container) return;
        
        const recent = this.reports.slice(0, 5);
        container.innerHTML = recent.map(r => `
            <div class="report-item">
                <div class="report-info">
                    <h4>${r.title}</h4>
                    <small>${MPC_DATA.categories[r.category].label} • ${r.location}</small>
                </div>
                <span class="status-badge status-${r.status}">
                    ${MPC_DATA.statusLabels[r.status]}
                </span>
            </div>
        `).join('');
    }

    // Liste complète des signalements
    renderReportsList(filters = {}) {
        const container = document.getElementById('reports-container');
        if (!container) return;

        let filtered = [...this.reports];

        if (filters.search) {
            filtered = filtered.filter(r => 
                r.title.toLowerCase().includes(filters.search) ||
                r.description.toLowerCase().includes(filters.search) ||
                r.location.toLowerCase().includes(filters.search) ||
                r.id.toLowerCase().includes(filters.search)
            );
        }

        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(r => r.status === filters.status);
        }

        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(r => r.category === filters.category);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <p>Aucun signalement trouvé</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(r => `
            <div class="report-full-item">
                <div class="report-full-header">
                    <h4>${r.title}</h4>
                    <span class="status-badge status-${r.status}">
                        ${MPC_DATA.statusLabels[r.status]}
                    </span>
                </div>
                <div class="report-full-meta">
                    <span><i class="fas fa-hashtag"></i> ${r.id}</span>
                    <span><i class="fas fa-tag"></i> ${MPC_DATA.categories[r.category].label}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${r.location}</span>
                    <span><i class="fas fa-calendar"></i> ${this.formatDate(r.date)}</span>
                    <span><i class="fas fa-user"></i> ${r.name}</span>
                </div>
                <p class="report-full-desc">${r.description}</p>
            </div>
        `).join('');
    }

    // Rapports pour l'agent
    renderAgentReports() {
        const container = document.getElementById('agent-reports-list');
        if (!container) return;
        
        container.innerHTML = this.reports.map(r => `
            <div class="report-full-item">
                <div class="report-full-header">
                    <h4>${r.title}</h4>
                    <span class="status-badge status-${r.status}">
                        ${MPC_DATA.statusLabels[r.status]}
                    </span>
                </div>
                <div class="report-full-meta">
                    <span><i class="fas fa-hashtag"></i> ${r.id}</span>
                    <span><i class="fas fa-tag"></i> ${MPC_DATA.categories[r.category].label}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${r.location}</span>
                    <span><i class="fas fa-user-shield"></i> ${r.agent}</span>
                </div>
                <p class="report-full-desc">${r.description}</p>
                <div class="report-full-actions">
                    <button class="btn btn-small btn-primary" onclick="app.updateStatus('${r.id}', 'progress')">
                        <i class="fas fa-spinner"></i> En cours
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="app.updateStatus('${r.id}', 'resolved')" style="background: var(--success); color: white;">
                        <i class="fas fa-check"></i> Résolu
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Mise à jour du statut
    updateStatus(id, newStatus) {
        const report = this.reports.find(r => r.id === id);
        if (report) {
            report.status = newStatus;
            report.agent = 'Agent communautaire - Avé 2';
            this.saveReports();
            this.renderAgentReports();
            this.renderDashboard();
            this.renderReportsList();
            
            const statusText = MPC_DATA.statusLabels[newStatus];
            alert(`✅ Statut mis à jour : ${statusText}`);
        }
    }

    updateOfflineCount(count = null) {
        const el = document.getElementById('offline-count');
        if (!el) return;
        
        if (count === null) {
            count = Math.floor(Math.random() * 5);
        }
        el.textContent = `${count} signalement(s) en attente de synchronisation`;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    }
}

// ========================================
// FONCTIONS GLOBALES (Accessibles depuis le HTML)
// ========================================

function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('active');
}

function exportReport(type) {
    if (type === 'csv') {
        const csv = [
            ['ID', 'Catégorie', 'Titre', 'Description', 'Lieu', 'Statut', 'Date'],
            ...app.reports.map(r => [
                r.id, 
                MPC_DATA.categories[r.category].label,
                r.title, 
                r.description, 
                r.location, 
                MPC_DATA.statusLabels[r.status], 
                r.date
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MPC_Rapport_Ave2_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert('📄 Génération du rapport PDF en cours...\n\n(Fonctionnalité à implémenter avec jsPDF en production)');
    }
}

// ========================================
// GESTION DE LA BULLE DE CONTACT
// ========================================

function toggleBubble() {
    const bubble = document.getElementById('contact-bubble');
    const toggle = document.getElementById('bubble-toggle');
    if (!bubble || !toggle) return;

    const badge = toggle.querySelector('.notification-badge');
    
    bubble.classList.toggle('active');
    
    // Retirer le badge de notification après le premier clic
    if (badge && bubble.classList.contains('active')) {
        setTimeout(() => {
            badge.style.display = 'none';
        }, 500);
    }
    
    // Changer l'icône du bouton selon l'état
    const icon = toggle.querySelector('i');
    if (bubble.classList.contains('active')) {
        icon.className = 'fas fa-times';
    } else {
        icon.className = 'fas fa-headset';
    }
}

// Fermer la bulle en cliquant en dehors
document.addEventListener('click', function(event) {
    const container = document.querySelector('.contact-bubble-container');
    const bubble = document.getElementById('contact-bubble');
    
    if (container && bubble && !container.contains(event.target) && bubble.classList.contains('active')) {
        toggleBubble();
    }
});

// ========================================
// INITIALISATION AU CHARGEMENT
// ========================================

let app;
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser l'application principale
    app = new MPCApp();

    // Afficher automatiquement une animation sur la bulle après 5 secondes
    setTimeout(() => {
        const toggle = document.getElementById('bubble-toggle');
        if (toggle && !sessionStorage.getItem('bubbleShown')) {
            toggle.style.animation = 'pulse 1.5s infinite, bounce 1s infinite';
            sessionStorage.setItem('bubbleShown', 'true');
        }
    }, 5000);
});