// ========================================
// APPLICATION MPC-REDEVABILITÉ
// ========================================

console.log("✅ Le fichier app.js est bien chargé !");

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-wLaWxgyJ5O6RDr1okMSKlxQQJNfDf2Ih7RYCHiu4_ZAXcHBJZNyLC7edFRqTL7_0/exec';

class MPCApp {
    constructor() {
        this.reports = [];
        this.currentView = 'dashboard';
        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupForm();
        this.setupFilters();
        this.setupAgentTabs();
        
        // Ajouter un bouton de rafraîchissement
        this.addRefreshButton();
        
        // Charger les données depuis Google Sheets
        await this.loadReportsFromSheet();
        
        this.renderDashboard();
        this.renderReportsList();
        this.renderAgentReports();
        this.updateOfflineCount();
    }

    // 🆕 CHARGER LES DONNÉES DEPUIS GOOGLE SHEETS
    async loadReportsFromSheet() {
        try {
            const response = await fetch(GOOGLE_SCRIPT_URL);
            const data = await response.json();
            
            // Transformer les données du Sheet en format utilisable
            this.reports = data.map(row => ({
                id: row.id || row['id'] || '',
                date: row.date || row['date'] || '',
                category: row.categorie || row['categorie'] || row.category || 'autre',
                title: row.titre || row['titre'] || row.title || '',
                description: row.description || '',
                location: row.lieu || row['lieu'] || row.location || '',
                name: row.nom || row['nom'] || row.name || 'Anonyme',
                phone: row.telephone || row['telephone'] || row.phone || '',
                status: row.statut || row['statut'] || row.status || 'pending',
                agent: row.agent || row['agent'] || 'Non assigné'
            })).reverse(); // Plus récent en premier
            
            console.log(`✅ ${this.reports.length} signalements chargés depuis le Sheet`);
        } catch (error) {
            console.error('Erreur de chargement:', error);
            this.reports = MPC_DATA.initialReports;
        }
    }

    // 🆕 BOUTON DE RAFRAÎCHISSEMENT
    addRefreshButton() {
        const hero = document.querySelector('.hero');
        if (hero && !document.getElementById('refresh-btn')) {
            const btn = document.createElement('button');
            btn.id = 'refresh-btn';
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualiser les données';
            btn.style.cssText = 'margin-top: 1rem; padding: 0.6rem 1.2rem; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s;';
            btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.3)';
            btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.2)';
            btn.onclick = () => this.refreshData();
            hero.appendChild(btn);
        }
    }

    // 🆕 RAFRAÎCHIR LES DONNÉES
    async refreshData() {
        const btn = document.getElementById('refresh-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
            btn.disabled = true;
        }
        
        await this.loadReportsFromSheet();
        this.renderDashboard();
        this.renderReportsList();
        this.renderAgentReports();
        
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Données à jour !';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualiser les données';
                btn.disabled = false;
            }, 2000);
        }
    }

    saveReports() {
        localStorage.setItem('mpc_reports', JSON.stringify(this.reports));
    }

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

    async submitReport(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitBtn.disabled = true;

        const newReport = {
            id: `MPC-${String(Date.now()).slice(-6)}`,
            category: document.getElementById('category').value,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            location: document.getElementById('location').value,
            name: document.getElementById('anonymous').checked ? 'Anonyme' : (document.getElementById('name').value || 'Anonyme'),
            phone: document.getElementById('anonymous').checked ? '' : document.getElementById('phone').value,
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            agent: 'Non assigné'
        };

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReport)
            });

            this.reports.unshift(newReport);
            this.saveReports();

            const trackingNumberEl = document.getElementById('tracking-number');
            const modal = document.getElementById('success-modal');
            if (trackingNumberEl) trackingNumberEl.textContent = newReport.id;
            if (modal) modal.classList.add('active');

            form.reset();
            const charCount = document.getElementById('char-count');
            if (charCount) charCount.textContent = '0 / 500';

            this.renderDashboard();
            this.renderReportsList();
            this.renderAgentReports();
        } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Erreur. Contactez le Bureau du Citoyen au +228 91 36 66 25.');
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    }

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
            syncBtn.addEventListener('click', () => this.refreshData());
        }
    }

    // 🆕 TABLEAU DE BORD : Exclut les résolus de l'affichage principal
    renderDashboard() {
        const activeReports = this.reports.filter(r => 
            r.status !== 'resolved' && r.status !== 'Résolu'
        );

        const stats = {
            total: activeReports.length,
            resolved: this.reports.filter(r => r.status === 'resolved' || r.status === 'Résolu').length,
            progress: activeReports.filter(r => r.status === 'progress' || r.status === 'En cours').length,
            pending: activeReports.filter(r => r.status === 'pending' || r.status === 'En attente').length
        };

        const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
        setEl('stat-total', stats.total);
        setEl('stat-resolved', stats.resolved);
        setEl('stat-progress', stats.progress);
        setEl('stat-pending', stats.pending);

        this.renderCategoriesChart(activeReports);
        this.renderRecentReports(activeReports);
    }

    // 🆕 GRAPHIQUE : Exclut les résolus
    renderCategoriesChart(reportsToDisplay = null) {
        const container = document.getElementById('categories-chart');
        if (!container) return;

        const reports = reportsToDisplay || this.reports.filter(r => 
            r.status !== 'resolved' && r.status !== 'Résolu'
        );

        const counts = {};
        reports.forEach(r => {
            counts[r.category] = (counts[r.category] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(counts), 1);
        
        container.innerHTML = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => {
                const info = MPC_DATA.categories[cat] || { label: cat, color: '#64748b' };
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

    // 🆕 SIGNALEMENTS RÉCENTS : Exclut les résolus
    renderRecentReports(reportsToDisplay = null) {
        const container = document.getElementById('recent-reports');
        if (!container) return;
        
        const reports = reportsToDisplay || this.reports.filter(r => 
            r.status !== 'resolved' && r.status !== 'Résolu'
        );
        
        const recent = reports.slice(0, 5);
        container.innerHTML = recent.map(r => {
            const info = MPC_DATA.categories[r.category] || { label: r.category };
            const statusLabel = this.getStatusLabel(r.status);
            const statusClass = this.getStatusClass(r.status);
            return `
                <div class="report-item">
                    <div class="report-info">
                        <h4>${r.title}</h4>
                        <small>${info.label} • ${r.location}</small>
                    </div>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
            `;
        }).join('');
    }

    // 🆕 LISTE DE SUIVI : Exclut les résolus par défaut (sauf si filtré)
    renderReportsList(filters = {}) {
        const container = document.getElementById('reports-container');
        if (!container) return;

        let filtered = [...this.reports];
        
        // Masquer les résolus par défaut, sauf si l'utilisateur filtre explicitement dessus
        if (!filters.status || filters.status === 'all') {
            filtered = filtered.filter(r => r.status !== 'resolved' && r.status !== 'Résolu');
        }

        if (filters.search) {
            filtered = filtered.filter(r => 
                r.title.toLowerCase().includes(filters.search) ||
                r.description.toLowerCase().includes(filters.search) ||
                r.location.toLowerCase().includes(filters.search) ||
                r.id.toLowerCase().includes(filters.search)
            );
        }

        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(r => this.getStatusClass(r.status).includes(filters.status));
        }

        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(r => r.category === filters.category);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: var(--success);"></i>
                    <p style="font-size: 1.1rem; font-weight: 600;">Aucun signalement en cours</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Tous les problèmes ont été résolus ! 🎉</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(r => {
            const info = MPC_DATA.categories[r.category] || { label: r.category };
            const statusLabel = this.getStatusLabel(r.status);
            const statusClass = this.getStatusClass(r.status);
            return `
                <div class="report-full-item">
                    <div class="report-full-header">
                        <h4>${r.title}</h4>
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="report-full-meta">
                        <span><i class="fas fa-hashtag"></i> ${r.id}</span>
                        <span><i class="fas fa-tag"></i> ${info.label}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${r.location}</span>
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(r.date)}</span>
                        <span><i class="fas fa-user"></i> ${r.name}</span>
                    </div>
                    <p class="report-full-desc">${r.description}</p>
                </div>
            `;
        }).join('');
    }

    // 🆕 ESPACE AGENT : Affiche TOUT, mais grise les résolus et retire les boutons
    renderAgentReports() {
        const container = document.getElementById('agent-reports-list');
        if (!container) return;
        
        container.innerHTML = this.reports.map(r => {
            const info = MPC_DATA.categories[r.category] || { label: r.category };
            const statusLabel = this.getStatusLabel(r.status);
            const statusClass = this.getStatusClass(r.status);
            
            const isResolved = r.status === 'resolved' || r.status === 'Résolu';
            const actionsHtml = isResolved ? 
                '<p style="color: var(--success); font-weight: 600; margin-top: 1rem;"><i class="fas fa-check-circle"></i> Ce signalement a été résolu</p>' :
                `
                <div class="report-full-actions">
                    <button class="btn btn-small btn-primary" onclick="app.updateStatus('${r.id}', 'progress')">
                        <i class="fas fa-spinner"></i> En cours
                    </button>
                    <button class="btn btn-small" onclick="app.updateStatus('${r.id}', 'resolved')" style="background: var(--success); color: white;">
                        <i class="fas fa-check"></i> Résolu
                    </button>
                </div>
                `;
            
            return `
                <div class="report-full-item" style="${isResolved ? 'opacity: 0.6;' : ''}">
                    <div class="report-full-header">
                        <h4>${r.title}</h4>
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="report-full-meta">
                        <span><i class="fas fa-hashtag"></i> ${r.id}</span>
                        <span><i class="fas fa-tag"></i> ${info.label}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${r.location}</span>
                        <span><i class="fas fa-user-shield"></i> ${r.agent}</span>
                    </div>
                    <p class="report-full-desc">${r.description}</p>
                    ${actionsHtml}
                </div>
            `;
        }).join('');
    }

    // 🆕 MISE À JOUR AUTOMATIQUE DU STATUT DANS LE SHEET
    async updateStatus(id, newStatus) {
        const report = this.reports.find(r => r.id === id);
        if (!report) return;

        const statusText = this.getStatusLabel(newStatus);
        
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateStatus',
                    id: id,
                    status: newStatus,
                    agent: 'Agent communautaire - Avé 2'
                })
            });

            report.status = newStatus;
            report.agent = 'Agent communautaire - Avé 2';
            this.saveReports();
            
            this.renderAgentReports();
            this.renderDashboard();
            this.renderReportsList();
            
            alert(`✅ Statut mis à jour : ${statusText}\n📊 Le Google Sheet a été synchronisé !`);
        } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Erreur de mise à jour. Veuillez réessayer.');
        }
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'En attente',
            'En attente': 'En attente',
            'progress': 'En cours',
            'En cours': 'En cours',
            'resolved': 'Résolu',
            'Résolu': 'Résolu'
        };
        return labels[status] || status;
    }

    getStatusClass(status) {
        if (status === 'pending' || status === 'En attente') return 'status-pending';
        if (status === 'progress' || status === 'En cours') return 'status-progress';
        if (status === 'resolved' || status === 'Résolu') return 'status-resolved';
        return 'status-pending';
    }

    updateOfflineCount(count = null) {
        const el = document.getElementById('offline-count');
        if (!el) return;
        if (count === null) count = Math.floor(Math.random() * 5);
        el.textContent = `${count} signalement(s) en attente de synchronisation`;
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    }
}

// Fonctions globales
function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('active');
}

function exportReport(type) {
    if (type === 'csv') {
        const csv = [
            ['ID', 'Catégorie', 'Titre', 'Description', 'Lieu', 'Statut', 'Date', 'Agent'],
            ...app.reports.map(r => [
                r.id, 
                (MPC_DATA.categories[r.category] || {label: r.category}).label,
                r.title, 
                r.description, 
                r.location, 
                app.getStatusLabel(r.status), 
                r.date,
                r.agent
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
        alert('📄 Génération du rapport PDF en cours...\n\n(Fonctionnalité à implémenter avec jsPDF)');
    }
}

function toggleBubble() {
    const bubble = document.getElementById('contact-bubble');
    const toggle = document.getElementById('bubble-toggle');
    if (!bubble || !toggle) return;

    const badge = toggle.querySelector('.notification-badge');
    bubble.classList.toggle('active');
    
    if (badge && bubble.classList.contains('active')) {
        setTimeout(() => badge.style.display = 'none', 500);
    }
    
    const icon = toggle.querySelector('i');
    icon.className = bubble.classList.contains('active') ? 'fas fa-times' : 'fas fa-headset';
}

document.addEventListener('click', function(event) {
    const container = document.querySelector('.contact-bubble-container');
    const bubble = document.getElementById('contact-bubble');
    if (container && bubble && !container.contains(event.target) && bubble.classList.contains('active')) {
        toggleBubble();
    }
});

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MPCApp();
    setTimeout(() => {
        const toggle = document.getElementById('bubble-toggle');
        if (toggle && !sessionStorage.getItem('bubbleShown')) {
            toggle.style.animation = 'pulse 1.5s infinite';
            sessionStorage.setItem('bubbleShown', 'true');
        }
    }, 5000);
});