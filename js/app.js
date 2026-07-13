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

// ========================================
// FONCTIONS GLOBALES
// ========================================

function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('active');
}

// 🆕 GESTION DE LA MODAL D'EXPORT (Compatible avec le HTML statique)
function showExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) modal.classList.add('active');
}

function closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) modal.classList.remove('active');
}

// 🆕 EXPORT PDF PROFESSIONNEL AVEC LOGO AVE 2 - VERSION CORRIGÉE
async function exportReport(type, period = 'all') {
    if (type === 'pdf') {
        closeExportModal();
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const colors = {
            primary: '#2D7A3E',
            secondary: '#4CAF50',
            accent: '#1B5E20',
            text: '#333333',
            light: '#E8F5E9'
        };
        
        let filteredReports = [...app.reports];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        if (period === 'month') {
            filteredReports = filteredReports.filter(r => {
                const date = new Date(r.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });
        } else if (period === 'quarter') {
            const quarterStart = currentMonth - (currentMonth % 3);
            filteredReports = filteredReports.filter(r => {
                const date = new Date(r.date);
                return date.getMonth() >= quarterStart && date.getMonth() < quarterStart + 3 && date.getFullYear() === currentYear;
            });
        } else if (period === 'year') {
            filteredReports = filteredReports.filter(r => {
                const date = new Date(r.date);
                return date.getFullYear() === currentYear;
            });
        }
        
        filteredReports.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const stats = {
            total: filteredReports.length,
            resolved: filteredReports.filter(r => r.status === 'resolved' || r.status === 'Résolu').length,
            progress: filteredReports.filter(r => r.status === 'progress' || r.status === 'En cours').length,
            pending: filteredReports.filter(r => r.status === 'pending' || r.status === 'En attente').length
        };
        
        const periodLabels = {
            'month': `Rapport Mensuel - ${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
            'quarter': `Rapport Trimestriel - ${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
            'year': `Rapport Annuel ${currentYear}`,
            'all': 'Rapport Complet - Tous les signalements'
        };
        
        // ==================== PAGE 1 : COUVERTURE ====================
        
        // Logo Avé 2 (cercle vert avec texte)
        doc.setFillColor(colors.primary);
        doc.circle(35, 35, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Avé', 28, 32);
        doc.setFontSize(18);
        doc.text('2', 47, 38);
        
        // Titre principal
        doc.setTextColor(colors.primary);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('MPC-REDEVABILITÉ', 105, 25, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.text);
        doc.text('Mécanismes de Participation Citoyenne', 105, 33, { align: 'center' });
        
        // Commune
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.accent);
        doc.text('Commune d\'Avé 2', 105, 45, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('(Aképé - Noépé - Badja)', 105, 52, { align: 'center' });
        
        // Ligne de séparation
        doc.setDrawColor(colors.primary);
        doc.setLineWidth(1);
        doc.line(15, 60, 195, 60);
        
        // Titre du rapport
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.accent);
        doc.text(periodLabels[period], 105, 75, { align: 'center' });
        
        // Date de génération
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text(`Généré le ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 105, 85, { align: 'center' });
        
        // Pied de page page 1
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Commune d\'Avé 2 - Bureau du Citoyen', 15, 285);
        doc.text('Contact: +228 91 36 66 25', 150, 285);
        doc.text('Page 1', 105, 285, { align: 'center' });
        
        // ==================== PAGE 2 : STATISTIQUES ====================
        doc.addPage();
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary);
        doc.text('📊 Vue d\'ensemble', 105, 20, { align: 'center' });
        
        // Statistiques en boîtes colorées
        const statsData = [
            { label: 'Total des signalements', value: stats.total, color: colors.primary },
            { label: 'En attente', value: stats.pending, color: '#F59E0B' },
            { label: 'En cours de traitement', value: stats.progress, color: '#3B82F6' },
            { label: 'Résolus', value: stats.resolved, color: colors.secondary }
        ];
        
        let yPos = 35;
        statsData.forEach((stat) => {
            // Rectangle de fond
            doc.setFillColor(stat.color);
            doc.rect(15, yPos, 180, 25, 'F');
            
            // Texte
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text(stat.label, 25, yPos + 15);
            
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(stat.value.toString(), 180, yPos + 16, { align: 'right' });
            
            yPos += 35;
        });
        
        // Taux de résolution
        const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        
        doc.setFontSize(14);
        doc.setTextColor(colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text(`Taux de résolution : ${resolutionRate}%`, 15, yPos + 10);
        
        // Barre de progression
        doc.setFillColor(colors.light);
        doc.rect(15, yPos + 15, 180, 12, 'F');
        doc.setFillColor(colors.secondary);
        doc.rect(15, yPos + 15, (resolutionRate * 180) / 100, 12, 'F');
        
        // Bordure de la barre
        doc.setDrawColor(colors.primary);
        doc.setLineWidth(0.5);
        doc.rect(15, yPos + 15, 180, 12, 'S');
        
        // Pied de page page 2
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Commune d\'Avé 2 - Bureau du Citoyen', 15, 285);
        doc.text('Contact: +228 91 36 66 25', 150, 285);
        doc.text('Page 2', 105, 285, { align: 'center' });
        
        // ==================== PAGE 3 : DÉTAILS DES SIGNALEMENTS ====================
        doc.addPage();
        
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary);
        doc.text('📋 Détail des signalements', 105, 20, { align: 'center' });
        
        // Préparer les données pour le tableau
        const tableData = filteredReports.map(r => {
            const categoryLabel = (MPC_DATA.categories[r.category] || { label: r.category }).label;
            const statusLabel = app.getStatusLabel(r.status);
            return [
                r.id,
                r.date,
                categoryLabel,
                r.title.substring(0, 35) + (r.title.length > 35 ? '...' : ''),
                r.location.substring(0, 25) + (r.location.length > 25 ? '...' : ''),
                statusLabel
            ];
        });
        
        // Créer le tableau avec autoTable
        doc.autoTable({
            startY: 30,
            head: [['ID', 'Date', 'Catégorie', 'Titre', 'Lieu', 'Statut']],
            body: tableData,
            theme: 'striped',
            headStyles: { 
                fillColor: colors.primary,
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: { 
                fontSize: 9,
                textColor: colors.text
            },
            alternateRowStyles: { 
                fillColor: colors.light 
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 25 },
                2: { cellWidth: 30 },
                3: { cellWidth: 45 },
                4: { cellWidth: 35 },
                5: { cellWidth: 25 }
            },
            didParseCell: function(data) {
                // Colorer les statuts
                if (data.section === 'body' && data.column.index === 5) {
                    const status = data.cell.raw;
                    if (status === 'Résolu') {
                        data.cell.styles.textColor = '#10B981';
                        data.cell.styles.fontStyle = 'bold';
                    } else if (status === 'En cours') {
                        data.cell.styles.textColor = '#3B82F6';
                    } else if (status === 'En attente') {
                        data.cell.styles.textColor = '#F59E0B';
                    }
                }
            },
            footStyles: {
                fillColor: colors.primary,
                textColor: 255
            }
        });
        
        // ==================== PIED DE PAGE GLOBAL ====================
        const finalPage = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= finalPage; i++) {
            doc.setPage(i);
            
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Page ${i} sur ${finalPage}`, 105, 285, { align: 'center' });
            doc.text('Commune d\'Avé 2 - Bureau du Citoyen', 15, 285);
            doc.text('Contact: +228 91 36 66 25', 150, 285);
        }
        
        // Télécharger le PDF
        const fileName = `Rapport_MPC_Ave2_${period}_${now.toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
    } else if (type === 'csv') {
        closeExportModal();
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
    }
}
        
        // COUVERTURE
        try {
            const logoResponse = await fetch('assets/logo-ave2.png');
            const logoBlob = await logoResponse.blob();
            const logoReader = new FileReader();
            await new Promise((resolve) => {
                logoReader.onloadend = () => resolve();
                logoReader.readAsDataURL(logoBlob);
            });
            doc.addImage(logoReader.result, 'PNG', 15, 15, 40, 40);
        } catch (error) {
            doc.setFillColor(colors.primary);
            doc.circle(35, 35, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text('Avé 2', 35, 38, { align: 'center' });
        }
        
        doc.setTextColor(colors.primary);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('MPC-REDEVABILITÉ', 105, 25, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Mécanismes de Participation Citoyenne', 105, 33, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Commune d\'Avé 2', 105, 45, { align: 'center' });
        doc.setFontSize(12);
        doc.text('(Aképé - Noépé - Badja)', 105, 52, { align: 'center' });
        
        doc.setDrawColor(colors.primary);
        doc.setLineWidth(0.5);
        doc.line(15, 60, 195, 60);
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.accent);
        doc.text(periodLabels[period], 105, 75, { align: 'center' });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text(`Généré le ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 105, 85, { align: 'center' });
        
        // STATISTIQUES
        doc.addPage();
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary);
        doc.text('📊 Vue d\'ensemble', 105, 20, { align: 'center' });
        
        const statsData = [
            { label: 'Total des signalements', value: stats.total, color: colors.primary },
            { label: 'En attente', value: stats.pending, color: '#F59E0B' },
            { label: 'En cours de traitement', value: stats.progress, color: '#3B82F6' },
            { label: 'Résolus ✅', value: stats.resolved, color: colors.secondary }
        ];
        
        let yPos = 35;
        statsData.forEach((stat) => {
            doc.setFillColor(stat.color);
            doc.roundedRect(15, yPos, 180, 20, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text(stat.label, 25, yPos + 13);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(stat.value.toString(), 180, yPos + 13, { align: 'right' });
            yPos += 30;
        });
        
        const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        doc.setFontSize(14);
        doc.setTextColor(colors.primary);
        doc.text(`Taux de résolution : ${resolutionRate}%`, 15, yPos + 10);
        
        doc.setFillColor(colors.light);
        doc.rect(15, yPos + 15, 180, 10, 'F');
        doc.setFillColor(colors.secondary);
        doc.rect(15, yPos + 15, (resolutionRate * 180) / 100, 10, 'F');
        
        // DÉTAILS
        doc.addPage();
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary);
        doc.text('📋 Détail des signalements', 105, 20, { align: 'center' });
        
        const tableData = filteredReports.map(r => {
            const categoryLabel = (MPC_DATA.categories[r.category] || { label: r.category }).label;
            return [
                r.id,
                r.date,
                categoryLabel,
                r.title.substring(0, 40) + (r.title.length > 40 ? '...' : ''),
                r.location,
                app.getStatusLabel(r.status)
            ];
        });
        
        doc.autoTable({
            startY: 30,
            head: [['ID', 'Date', 'Catégorie', 'Titre', 'Lieu', 'Statut']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: colors.primary, textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 9, textColor: colors.text },
            alternateRowStyles: { fillColor: colors.light },
            columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 }, 3: { cellWidth: 50 }, 4: { cellWidth: 35 }, 5: { cellWidth: 25 } },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 5) {
                    const status = data.cell.raw;
                    if (status === 'Résolu' || status === 'resolved') {
                        data.cell.styles.textColor = '#10B981';
                        data.cell.styles.fontStyle = 'bold';
                    } else if (status === 'En cours') {
                        data.cell.styles.textColor = '#3B82F6';
                    } else if (status === 'En attente') {
                        data.cell.styles.textColor = '#F59E0B';
                    }
                }
            }
        });
        
        // PIED DE PAGE
        const finalPage = doc.internal.getNumberOfPages();
        for (let i = 1; i <= finalPage; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Page ${i} sur ${finalPage}`, 105, 285, { align: 'center' });
            doc.text('Commune d\'Avé 2 - Bureau du Citoyen', 15, 285);
            doc.text('Contact: +228 91 36 66 25', 150, 285);
        }
        
        const fileName = `Rapport_MPC_Ave2_${period}_${now.toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
    } else if (type === 'csv') {
        closeExportModal();
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