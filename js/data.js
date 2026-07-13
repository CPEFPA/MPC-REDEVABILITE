// ========================================
// DONNÉES SIMULÉES - MPC-REDEVABILITÉ (AVÉ 2)
// ========================================

const CATEGORIES = {
    eau: { label: '💧 Eau potable', color: '#3b82f6' },
    assainissement: { label: '🗑️ Assainissement', color: '#10b981' },
    voirie: { label: '🛣️ Voirie', color: '#f59e0b' },
    sante: { label: '🏥 Santé', color: '#ef4444' },
    education: { label: '📚 Éducation', color: '#8b5cf6' },
    securite: { label: '🚨 Sécurité', color: '#ec4899' },
    autre: { label: '📋 Autre', color: '#64748b' }
};

// Données initiales adaptées aux cantons d'Aképé, Noépé et Badja
const INITIAL_REPORTS = [
    {
        id: 'MPC-000123',
        category: 'eau',
        title: 'Fuite d\'eau sur la canalisation principale',
        description: 'Une fuite importante d\'eau est observée depuis 3 jours sur la canalisation principale du canton d\'Aképé. L\'eau inonde la rue et crée des difficultés pour la circulation.',
        location: 'Canton d\'Aképé, près du marché central',
        name: 'Kodjo M.',
        phone: '+228 90 12 34 56',
        status: 'progress',
        date: '2026-07-10',
        agent: 'Agent communautaire - Zone Aképé'
    },
    {
        id: 'MPC-000124',
        category: 'assainissement',
        title: 'Accumulation de déchets au carrefour',
        description: 'Les ordures s\'accumulent au carrefour principal de Noépé depuis une semaine. La collecte ne passe plus régulièrement. Odeurs nauséabondes et risque sanitaire.',
        location: 'Carrefour principal de Noépé',
        name: 'Anonyme',
        phone: '',
        status: 'pending',
        date: '2026-07-11',
        agent: 'Non assigné'
    },
    {
        id: 'MPC-000125',
        category: 'voirie',
        title: 'Nid de poule dangereux',
        description: 'Un grand nid de poule s\'est formé sur la route reliant les cantons, causant des accidents de moto réguliers. Signalé déjà verbalement mais aucune action.',
        location: 'Route principale, face à l\'école de Badja',
        name: 'Ama K.',
        phone: '+228 99 88 77 66',
        status: 'resolved',
        date: '2026-07-05',
        agent: 'Agent communautaire - Zone Badja'
    },
    {
        id: 'MPC-000126',
        category: 'sante',
        title: 'Rupture de médicaments au dispensaire',
        description: 'Le dispensaire de Noépé est en rupture de médicaments essentiels depuis 5 jours. Les patients doivent aller dans la commune voisine pour se soigner.',
        location: 'Dispensaire de Noépé',
        name: 'Kossi A.',
        phone: '+228 91 23 45 67',
        status: 'progress',
        date: '2026-07-12',
        agent: 'Agent communautaire - Zone Noépé'
    },
    {
        id: 'MPC-000127',
        category: 'education',
        title: 'Toiture de l\'école qui fuit',
        description: 'La toiture de la salle de classe CM2 de l\'école d\'Aképé fuit pendant les pluies. Les élèves sont obligés de changer de salle.',
        location: 'École primaire publique d\'Aképé',
        name: 'Directeur de l\'école',
        phone: '+228 92 34 56 78',
        status: 'pending',
        date: '2026-07-12',
        agent: 'Non assigné'
    },
    {
        id: 'MPC-000128',
        category: 'securite',
        title: 'Éclairage public défaillant',
        description: 'Plusieurs lampadaires ne fonctionnent plus dans le quartier de Badja depuis un mois. Insécurité nocturne signalée par les riverains.',
        location: 'Rue secondaire, canton de Badja',
        name: 'Comité de quartier',
        phone: '+228 93 45 67 89',
        status: 'resolved',
        date: '2026-07-08',
        agent: 'Agent communautaire - Zone Badja'
    },
    {
        id: 'MPC-000129',
        category: 'eau',
        title: 'Pompe à eau en panne',
        description: 'Le forage communautaire du canton d\'Aképé est en panne depuis 10 jours. Les habitants doivent parcourir 2km pour avoir de l\'eau.',
        location: 'Forage communautaire, Aképé-Est',
        name: 'Fatou D.',
        phone: '+228 94 56 78 90',
        status: 'pending',
        date: '2026-07-13',
        agent: 'Non assigné'
    },
    {
        id: 'MPC-000130',
        category: 'assainissement',
        title: 'Caniveau bouché',
        description: 'Le caniveau principal de Noépé est bouché par des déchets. Risque d\'inondation avec les pluies annoncées.',
        location: 'Avenue principale, Noépé',
        name: 'Koffi B.',
        phone: '+228 95 67 89 01',
        status: 'progress',
        date: '2026-07-11',
        agent: 'Agent communautaire - Zone Noépé'
    }
];

// Statut labels
const STATUS_LABELS = {
    pending: 'En attente',
    progress: 'En cours',
    resolved: 'Résolu'
};

// Export pour utilisation dans app.js
window.MPC_DATA = {
    categories: CATEGORIES,
    initialReports: INITIAL_REPORTS,
    statusLabels: STATUS_LABELS
};