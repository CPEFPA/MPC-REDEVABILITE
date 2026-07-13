    submitReport(form) {
        // 1. Désactiver le bouton pour éviter les doubles envois
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitBtn.disabled = true;

        // 2. Préparer les données
        const newReport = {
            id: `MPC-${String(this.reports.length + 123).padStart(6, '0')}`,
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

        // 3. TON URL GOOGLE APPS SCRIPT (Déjà intégrée !)
        const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-wLaWxgyJ5O6RDr1okMSKlxQQJNfDf2Ih7RYCHiu4_ZAXcHBJZNyLC7edFRqTL7_0/exec';

        // 4. Envoyer les données à Google Sheets
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Obligatoire pour Google Apps Script
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newReport)
        })
        .then(() => {
            // Ajouter localement pour un affichage immédiat dans l'app
            this.reports.unshift(newReport);
            this.saveReports(); // Copie de secours dans le navigateur

            // Afficher le modal de succès
            const trackingNumberEl = document.getElementById('tracking-number');
            const modal = document.getElementById('success-modal');
            if (trackingNumberEl) trackingNumberEl.textContent = newReport.id;
            if (modal) modal.classList.add('active');

            // Réinitialiser le formulaire
            form.reset();
            const charCount = document.getElementById('char-count');
            if (charCount) charCount.textContent = '0 / 500';

            // Rafraîchir les vues
            this.renderDashboard();
            this.renderReportsList();
            this.renderAgentReports();
        })
        .catch(error => {
            console.error('Erreur d\'envoi:', error);
            alert('❌ Une erreur est survenue. Veuillez réessayer ou contacter le Bureau du Citoyen au +228 91 36 66 25.');
        })
        .finally(() => {
            // Réactiver le bouton dans tous les cas
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        });
    }