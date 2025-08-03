// Service Worker Registration et PWA Installation
let deferredPrompt;
let installBtn;

// Variables DOM
let categoryInput, categoryTypeSelect, addCategoryBtn;
let linkCategorySelect, linkNameInput, linkURLInput, addLinkBtn;
let linksContainer, hamburgerBtn, themeMenu, themeBtns;

// Données
let categories = {}; // { "Dev Tools": { type: "liens", items: [ { name: "GitHub", url: "https://..." } ] } }

document.addEventListener("DOMContentLoaded", () => {
    initializeElements();
    registerServiceWorker();
    setupPWAInstallation();
    setupEventListeners();
    loadData();
});

// Initialiser les éléments DOM
function initializeElements() {
    categoryInput = document.getElementById("newCategoryName");
    categoryTypeSelect = document.getElementById("categoryType");
    addCategoryBtn = document.getElementById("addCategoryBtn");
    linkCategorySelect = document.getElementById("linkCategory");
    linkNameInput = document.getElementById("linkName");
    linkURLInput = document.getElementById("linkURL");
    addLinkBtn = document.getElementById("addLinkBtn");
    linksContainer = document.getElementById("linksContainer");
    hamburgerBtn = document.getElementById("hamburgerBtn");
    themeMenu = document.getElementById("themeMenu");
    themeBtns = document.querySelectorAll(".theme-btn");
    installBtn = document.getElementById("installBtn");
}

// Enregistrer le Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker enregistré avec succès:', registration);
            
            // Écouter les mises à jour
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nouvelle version disponible
                        if (confirm('Une nouvelle version est disponible. Voulez-vous recharger ?')) {
                            window.location.reload();
                        }
                    }
                });
            });
        } catch (error) {
            console.log('Échec de l\'enregistrement du Service Worker:', error);
        }
    }
}

// Configuration de l'installation PWA
function setupPWAInstallation() {
    // Écouter l'événement beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    // Écouter l'installation de l'app
    window.addEventListener('appinstalled', () => {
        console.log('PWA installée avec succès');
        hideInstallButton();
        deferredPrompt = null;
    });

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
        hideInstallButton();
    }
}

// Afficher le bouton d'installation
function showInstallButton() {
    if (installBtn) {
        installBtn.style.display = 'block';
    }
}

// Cacher le bouton d'installation
function hideInstallButton() {
    if (installBtn) {
        installBtn.style.display = 'none';
    }
}

// Installer l'application
async function installApp() {
    if (!deferredPrompt) {
        alert('L\'installation n\'est pas disponible sur ce navigateur.');
        return;
    }

    const result = await deferredPrompt.prompt();
    console.log('Résultat de l\'installation:', result);

    if (result.outcome === 'accepted') {
        console.log('Utilisateur a accepté l\'installation');
    } else {
        console.log('Utilisateur a refusé l\'installation');
    }

    deferredPrompt = null;
    hideInstallButton();
}

// Configuration des événements
function setupEventListeners() {
    // Menu hamburger
    hamburgerBtn.addEventListener("click", toggleThemeMenu);

    // Boutons de thème
    themeBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            if (btn.id === 'installBtn') {
                installApp();
            } else {
                changeTheme(btn.dataset.theme);
            }
        });
    });

    // Boutons d'ajout
    addCategoryBtn.addEventListener("click", addCategory);
    addLinkBtn.addEventListener("click", addLink);

    // Entrée clavier
    categoryInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') addCategory();
    });

    linkNameInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') addLink();
    });

    linkURLInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') addLink();
    });

    // Fermer le menu en cliquant ailleurs
    document.addEventListener("click", (e) => {
        if (!themeMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            themeMenu.classList.add("hidden");
        }
    });
}

// Basculer le menu des thèmes
function toggleThemeMenu() {
    themeMenu.classList.toggle("hidden");
}

// Changer de thème
function changeTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    saveTheme(theme);
    themeMenu.classList.add("hidden");
}

// Charger les données depuis localStorage
function loadData() {
    try {
        const savedCategories = localStorage.getItem('favoritesCategories');
        const savedTheme = localStorage.getItem('favoritesTheme');
        
        if (savedCategories) {
            categories = JSON.parse(savedCategories);
            updateCategories();
            renderLinks();
        }
        
        if (savedTheme) {
            document.body.setAttribute("data-theme", savedTheme);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        categories = {};
    }
}

// Sauvegarder les données dans localStorage
function saveData() {
    try {
        localStorage.setItem('favoritesCategories', JSON.stringify(categories));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde. Vos données pourraient ne pas être conservées.');
    }
}

// Sauvegarder le thème
function saveTheme(theme) {
    try {
        localStorage.setItem('favoritesTheme', theme);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du thème:', error);
    }
}

// Ajouter une catégorie
function addCategory() {
    const name = categoryInput.value.trim();
    const type = categoryTypeSelect.value;
    
    if (!name) {
        alert('Veuillez entrer un nom de catégorie.');
        return;
    }
    
    if (categories[name]) {
        alert('Cette catégorie existe déjà.');
        return;
    }
    
    categories[name] = {
        type: type,
        items: []
    };
    
    updateCategories();
    renderLinks();
    saveData();
    categoryInput.value = "";
    
    // Sélectionner automatiquement la nouvelle catégorie
    linkCategorySelect.value = name;
}

// Ajouter un élément
function addLink() {
    const category = linkCategorySelect.value;
    const name = linkNameInput.value.trim();
    const url = linkURLInput.value.trim();
    
    if (!category) {
        alert('Veuillez d\'abord créer une catégorie.');
        return;
    }
    
    if (!name) {
        alert('Veuillez entrer un nom pour l\'élément.');
        return;
    }
    
    const item = { name: name };
    if (url) {
        // Validation basique de l'URL
        try {
            new URL(url.startsWith('http') ? url : 'https://' + url);
            item.url = url.startsWith('http') ? url : 'https://' + url;
        } catch {
            alert('URL invalide. Veuillez vérifier le format.');
            return;
        }
    }
    
    categories[category].items.push(item);
    renderLinks();
    saveData();
    linkNameInput.value = "";
    linkURLInput.value = "";
    
    // Focus sur le champ nom pour faciliter l'ajout multiple
    linkNameInput.focus();
}

// Supprimer une catégorie
function deleteCategory(categoryName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" et tout son contenu ?`)) {
        return;
    }
    
    delete categories[categoryName];
    updateCategories();
    renderLinks();
    saveData();
}

// Supprimer un élément
function deleteItem(categoryName, itemIndex) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?`)) {
        return;
    }
    
    categories[categoryName].items.splice(itemIndex, 1);
    renderLinks();
    saveData();
}

// Mettre à jour la liste déroulante des catégories
function updateCategories() {
    linkCategorySelect.innerHTML = "";
    
    const sortedCategories = Object.keys(categories).sort();
    
    if (sortedCategories.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Aucune catégorie disponible";
        opt.disabled = true;
        linkCategorySelect.appendChild(opt);
        return;
    }
    
    for (const name of sortedCategories) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        linkCategorySelect.appendChild(opt);
    }
}

// Afficher les liens
function renderLinks() {
    linksContainer.innerHTML = "";
    
    const sortedCategories = Object.keys(categories).sort();
    
    if (sortedCategories.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.style.textAlign = "center";
        emptyMessage.style.padding = "2rem";
        emptyMessage.style.color = "#666";
        emptyMessage.innerHTML = "<h3>Aucune catégorie créée</h3><p>Commencez par créer une catégorie ci-dessus.</p>";
        linksContainer.appendChild(emptyMessage);
        return;
    }
    
    for (const catName of sortedCategories) {
        const catData = categories[catName];
        const section = document.createElement("div");
        section.classList.add("category");

        // En-tête de catégorie avec bouton de suppression
        const header = document.createElement("div");
        header.classList.add("category-header");

        const titleContainer = document.createElement("div");
        titleContainer.style.display = "flex";
        titleContainer.style.alignItems = "center";
        titleContainer.style.gap = "0.5rem";

        const title = document.createElement("h3");
        title.textContent = catName;
        titleContainer.appendChild(title);

        const typeSpan = document.createElement("span");
        typeSpan.classList.add("category-type");
        typeSpan.textContent = catData.type;
        titleContainer.appendChild(typeSpan);

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.textContent = "×";
        deleteBtn.title = `Supprimer la catégorie "${catName}"`;
        deleteBtn.onclick = () => deleteCategory(catName);

        header.appendChild(titleContainer);
        header.appendChild(deleteBtn);
        section.appendChild(header);

        // Liste des éléments
        const list = document.createElement("ul");
        
        if (catData.items.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.style.fontStyle = "italic";
            emptyItem.style.color = "#999";
            emptyItem.textContent = "Aucun élément dans cette catégorie";
            list.appendChild(emptyItem);
        } else {
            catData.items.forEach((item, index) => {
                const listItem = document.createElement("li");
                
                const contentDiv = document.createElement("div");
                contentDiv.style.flex = "1";
                
                if (item.url) {
                    const link = document.createElement("a");
                    link.href = item.url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.textContent = item.name;
                    contentDiv.appendChild(link);
                } else {
                    const span = document.createElement("span");
                    span.textContent = item.name;
                    contentDiv.appendChild(span);
                }

                const itemDeleteBtn = document.createElement("button");
                itemDeleteBtn.classList.add("item-delete-btn");
                itemDeleteBtn.textContent = "×";
                itemDeleteBtn.title = `Supprimer "${item.name}"`;
                itemDeleteBtn.onclick = () => deleteItem(catName, index);

                listItem.appendChild(contentDiv);
                listItem.appendChild(itemDeleteBtn);
                list.appendChild(listItem);
            });
        }

        section.appendChild(list);
        linksContainer.appendChild(section);
    }
}

// Fonctions utilitaires pour l'export/import (futures fonctionnalités)
function exportData() {
    const data = {
        categories: categories,
        theme: localStorage.getItem('favoritesTheme') || 'light',
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-favoris-backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.categories) {
                if (confirm('Voulez-vous remplacer toutes vos données actuelles ?')) {
                    categories = data.categories;
                    if (data.theme) {
                        document.body.setAttribute("data-theme", data.theme);
                        saveTheme(data.theme);
                    }
                    updateCategories();
                    renderLinks();
                    saveData();
                    alert('Données importées avec succès !');
                }
            }
        } catch (error) {
            alert('Erreur lors de l\'importation du fichier.');
        }
    };
    reader.readAsText(file);
}

// Gestion du mode hors ligne
window.addEventListener('online', () => {
    console.log('Connexion Internet rétablie');
});

window.addEventListener('offline', () => {
    console.log('Mode hors ligne activé');
});
// Bouton d'installation PWA
if (installBtn) {
    installBtn.addEventListener('click', installApp);
}

// Initialiser les thèmes
document.body.setAttribute("data-theme", "light"); // Thème par défaut
changeTheme('light'); // Appliquer le thème par défaut

// Ajouter un écouteur pour l'importation de données
const importInput = document.getElementById('importInput');
if (importInput) {
    importInput.addEventListener('change', importData);
}

// Ajouter un bouton d'exportation
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
}
// Ajouter un bouton de réinitialisation
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos données ?')) {
            categories = {};
            localStorage.removeItem('favoritesCategories');
            localStorage.removeItem('favoritesTheme');
            updateCategories();
            renderLinks();
            alert('Données réinitialisées avec succès !');
        }
    });
}

// Ajouter un bouton de sauvegarde
const backupBtn = document.getElementById('backupBtn');
if (backupBtn) {
    backupBtn.addEventListener('click', () => {
        const backupData = {
            categories: categories,
            theme: localStorage.getItem('favoritesTheme') || 'light',
            backupDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mes-favoris-backup.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}
// Ajouter un bouton de restauration
const restoreBtn = document.getElementById('restoreBtn');
if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
        const backupFileInput = document.createElement('input');
        backupFileInput.type = 'file';
        backupFileInput.accept = '.json';
        backupFileInput.onchange = importData;
        backupFileInput.click();
    });
}