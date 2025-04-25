document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Caching ---
    const elements = {
        // ... (אותו דבר כמו ב-v4, ודאי שהכל קיים) ...
        appContainer: document.getElementById('app-container'),
        studioDashboard: document.getElementById('studio-dashboard'),
        detailPanel: document.getElementById('detail-panel'),
        panelContentWrapper: document.getElementById('detail-panel')?.querySelector('.panel-content-wrapper'),
        detailContent: document.getElementById('detail-content'),
        panelLoader: document.getElementById('panel-loader'),
        closePanelBtn: document.getElementById('close-panel-btn'),
        detailTitle: document.getElementById('detail-title'),
        detailCategory: document.getElementById('detail-category'),
        detailCategorySpan: document.getElementById('detail-category'),
        detailDescription: document.getElementById('detail-description'),
        detailExample: document.getElementById('detail-example'),
        detailExampleStrong: document.getElementById('detail-example')?.querySelector('strong'), // אלמנט ה-strong של הדוגמה
        relatedList: document.getElementById('related-list'),
        relatedContainer: document.getElementById('related-container'),
        favoriteBtn: document.getElementById('favorite-btn'),
        searchInput: document.getElementById('search-input'),
        favoritesToggleBtn: document.getElementById('favorites-toggle-btn'),
        statusMessageContainer: document.getElementById('status-message-container'),
        initialLoader: document.getElementById('initial-loader')
    };

    // --- State ---
    let favorites = [];
    let currentUseCaseId = null;
    let showingFavorites = false;
    let allCards = [];
    let isLoading = false;

    // --- Constants & Initial Setup ---
    const LS_FAVORITES_KEY = 'aiLndFavorites_v4'; // עדכון גירסה אם רוצים איפוס
    let CATEGORIES = [];
    let CATEGORY_ICONS = {};
    let categoryColors = [];
    const DEFAULT_ICON = "✨";
    const DEFAULT_CATEGORY_COLOR = '#777';

    // --- Initialization Function ---
    function initializeApp() {
        if (!validateDependencies()) return;
        loadFavorites();
        setupConstants();

        if (typeof aiUseCases === 'undefined' || !Array.isArray(aiUseCases) || aiUseCases.length === 0) {
            handleLoadError('שגיאה חמורה: לא ניתן היה לטעון את רשימת השימושים.');
            return;
        }

        renderStudioDashboard();
        setupEventListeners();
        updateFavoritesButtonVisualState();

        if (elements.initialLoader) elements.initialLoader.style.display = 'none';
    }

    // --- Helper Functions ---
    function validateDependencies() { /* (Same as v4) */
        for (const key in elements) {
            // Allow detailExampleStrong to be null initially
            if (!elements[key] && key !== 'detailExampleStrong') {
                console.error(`Initialization Error: Element '${key}' not found.`);
                document.body.innerHTML = `<p style="color:red; padding: 20px; text-align:center;">שגיאה קריטית: ${key} לא נמצא.</p>`;
                return false;
            }
        }
        return true;
     }
    function displayStatusMessage(message, type = 'info', duration = 3500) { /* (Same as v4) */
        if (!elements.statusMessageContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.className = `status-message ${type}`;
        messageDiv.setAttribute('role', 'alert');
        elements.statusMessageContainer.innerHTML = '';
        elements.statusMessageContainer.appendChild(messageDiv);
        if (duration > 0) {
            setTimeout(() => {
                if(messageDiv.parentNode === elements.statusMessageContainer) {
                    messageDiv.style.transition = 'opacity 0.5s ease';
                    messageDiv.style.opacity = '0';
                    setTimeout(() => messageDiv.remove(), 500);
                }
            }, duration);
        }
     }
    function handleLoadError(message) { /* (Same as v4) */
        console.error(message);
        if (elements.initialLoader) elements.initialLoader.style.display = 'none';
        displayStatusMessage(message, 'error', 0);
     }
    function loadFavorites() { /* (Same as v4) */
        try {
            const storedFavorites = localStorage.getItem(LS_FAVORITES_KEY);
            favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
            if (!Array.isArray(favorites)) favorites = [];
        } catch (e) { console.error("Error reading favorites:", e); favorites = []; }
     }
    function saveFavorites() { /* (Same as v4) */
        try { localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(favorites)); }
        catch (e) { console.error("Error saving favorites:", e); displayStatusMessage('שגיאה בשמירת המועדפים.', 'error');}
     }
    function setupConstants() { /* (Same as v4) */
         CATEGORIES = [...new Set(aiUseCases.map(uc => uc.category).filter(Boolean))];
         CATEGORY_ICONS = { /* Icons dictionary */
            "יצירת תוכן לימודי": "📝", "הערכה ומדידה": "📊", "התאמה אישית (פרסונליזציה)": "⚙️",
            "ניהול ידע ומאגרי מידע": "📚", "פיתוח חומרי עזר": "🛠️", "הנגשת מידע": "🌐",
            "תקשורת, מעורבות והטמעה": "💬", "ניתוח נתונים וקבלת החלטות": "📈",
            "מיומנויות רכות ותרבות ארגונית": "👥", "דיגיטציה והטמעת טכנולוגיה": "💻",
            "גיוס וקליטה": "🤝", "ניהול ושימור ידע ארגוני": "💾", "למידה מתמשכת ופיתוח קריירה": "🚀",
            "מודלים פדגוגיים מתקדמים": "🎓", "AI ייעודי להדרכה": "🤖",
            "יצירתיות, חדשנות ותכנון אסטרטגי": "💡", "תמיכה והכלה": "❤️",
            "ניהול פרויקטים והכשרת סגל": "📋", "שימושים מתקדמים ועתידיים": "🔮",
             "אחר": "✨"
         };
         try { /* Reading CSS colors */
            const cssVariables = getComputedStyle(document.documentElement);
            const colorsString = cssVariables.getPropertyValue('--cat-colors').trim();
            if (colorsString) {
                categoryColors = colorsString.split(',').map(color => color.trim());
                while (categoryColors.length < 10) categoryColors.push(DEFAULT_CATEGORY_COLOR);
            } else { throw new Error("--cat-colors not found"); }
         } catch (e) {
             console.error("Error reading CSS category colors:", e);
             categoryColors = Array(10).fill(DEFAULT_CATEGORY_COLOR);
         }
     }

    // --- Rendering Functions ---
    function renderStudioDashboard() { /* (Same as v4) */
        if (!elements.studioDashboard) return;
        elements.studioDashboard.innerHTML = '';
        allCards = [];

        const groupedUseCases = aiUseCases.reduce((acc, useCase) => {
            const category = useCase.category || 'אחר';
            if (!acc[category]) acc[category] = [];
            acc[category].push(useCase);
            return acc;
        }, {});

        const sortedCategories = CATEGORIES.filter(cat => groupedUseCases[cat]);
        if (groupedUseCases['אחר']) sortedCategories.push('אחר');

        sortedCategories.forEach((category, index) => {
            const categoryZone = createCategoryZone(category, index);
            const cardGrid = document.createElement('div');
            cardGrid.className = 'card-grid';
            groupedUseCases[category].sort((a, b) => a.id - b.id);
            groupedUseCases[category].forEach(useCase => {
                const card = createInspirationCard(useCase);
                cardGrid.appendChild(card);
                allCards.push(card);
            });
            categoryZone.appendChild(cardGrid);
            elements.studioDashboard.appendChild(categoryZone);
        });
        updateCardsVisualState();
     }
     function createCategoryZone(category, index) { /* (Same as v4) */
         const categoryZone = document.createElement('div');
         categoryZone.className = 'category-zone';
         const categoryColor = categoryColors[index % categoryColors.length] || DEFAULT_CATEGORY_COLOR;
         categoryZone.style.setProperty('--category-color', categoryColor);
         const categoryHeader = document.createElement('div');
         categoryHeader.className = 'category-header';
         const iconSpan = document.createElement('span');
         iconSpan.className = 'category-icon';
         iconSpan.setAttribute('aria-hidden', 'true');
         iconSpan.textContent = CATEGORY_ICONS[category] || DEFAULT_ICON;
         const categoryTitle = document.createElement('h2');
         categoryTitle.className = 'category-title';
         categoryTitle.textContent = category;
         categoryHeader.appendChild(iconSpan);
         categoryHeader.appendChild(categoryTitle);
         categoryZone.appendChild(categoryHeader);
         categoryZone.style.animationDelay = `${0.1 + index * 0.05}s`;
         return categoryZone;
      }
     function createInspirationCard(useCase) { /* (Same as v4) */
        const card = document.createElement('div');
        card.className = 'inspiration-card';
        card.dataset.id = useCase.id;
        card.dataset.category = useCase.category || 'אחר';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `שימוש ${useCase.id}: ${useCase.title || 'ללא כותרת'}`);
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        const cardId = document.createElement('span');
        cardId.className = 'card-id';
        cardId.textContent = useCase.id;
        const categoryIndex = CATEGORIES.indexOf(useCase.category);
        const categoryColor = categoryColors[categoryIndex % categoryColors.length] || DEFAULT_CATEGORY_COLOR;
        cardId.style.backgroundColor = categoryColor;
        const cardTitle = document.createElement('h3');
        cardTitle.className = 'card-title';
        cardTitle.textContent = useCase.title || 'שימוש ללא כותרת';
        cardContent.appendChild(cardId);
        cardContent.appendChild(cardTitle);
        const favoriteIndicator = document.createElement('span');
        favoriteIndicator.className = 'card-favorite-indicator';
        favoriteIndicator.setAttribute('aria-hidden', 'true');
        favoriteIndicator.textContent = '⭐';
        card.appendChild(cardContent);
        card.appendChild(favoriteIndicator);
        card.addEventListener('click', () => handleCardClick(useCase.id));
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(useCase.id); } });
        return card;
      }

    // --- Detail Panel Logic ---
     function handleCardClick(id) { /* (Same as v4) */
        if (isLoading || (elements.detailPanel.classList.contains('visible') && currentUseCaseId === id)) return;
        showDetails(id);
      }
     function showDetails(id) { /* (Same as v4) */
        if (isLoading || !elements.detailPanel) return;
        const useCaseIdNum = parseInt(id, 10);
        if (isNaN(useCaseIdNum)) return;
        isLoading = true;
        elements.detailPanel.classList.add('loading');
        clearPanelContent();
        if(elements.detailContent) elements.detailContent.scrollTop = 0;
        const useCase = aiUseCases.find(uc => uc.id === useCaseIdNum);
        if (!useCase) {
            handleLoadError(`שגיאה: לא נמצא שימוש מספר ${useCaseIdNum}.`);
            hideDetails();
            elements.detailPanel.classList.remove('loading');
            isLoading = false;
            return;
        }
        currentUseCaseId = useCaseIdNum;
        populatePanelContent(useCase); // Populate first
        elements.detailPanel.setAttribute('aria-hidden', 'false');
        elements.detailPanel.classList.add('visible'); // Then show
        setTimeout(() => { elements.detailPanel.classList.remove('loading'); isLoading = false; }, 50);
     }
     function clearPanelContent() { /* (Same as v4) */
        if (!elements.detailTitle) return;
        elements.detailTitle.textContent = '';
        if (elements.detailCategorySpan) elements.detailCategorySpan.textContent = '';
        elements.detailDescription.textContent = '';
        elements.detailExample.textContent = ''; // Clear the example text
        // Remove the strong tag if it exists from previous runs (or ensure CSS handles it)
        const strongTag = elements.detailExample.querySelector('strong');
        if (strongTag) strongTag.remove();

        elements.relatedList.innerHTML = '';
        if (elements.relatedContainer) elements.relatedContainer.style.display = 'none';
        if (elements.favoriteBtn) elements.favoriteBtn.style.visibility = 'hidden';
        if (elements.detailCategorySpan) { elements.detailCategorySpan.style.color = ''; elements.detailCategorySpan.style.borderBottomColor = ''; }
     }

    function populatePanelContent(useCase) {
        if (!elements.detailTitle || !elements.detailExample) return;

        elements.detailTitle.textContent = `${useCase.id}. ${useCase.title || ''}`;
        const categoryName = useCase.category || 'אחר';

        if(elements.detailCategorySpan) {
            elements.detailCategorySpan.textContent = categoryName;
            const categoryIndex = CATEGORIES.indexOf(categoryName);
            const categoryColor = categoryColors[categoryIndex % categoryColors.length] || DEFAULT_CATEGORY_COLOR;
            elements.detailCategorySpan.style.color = categoryColor;
            elements.detailCategorySpan.style.borderBottomColor = categoryColor;
        }

        elements.detailDescription.textContent = useCase.description || 'אין תיאור זמין.';

        // *** תיקון כפילות "דוגמה" ***
        // הצג רק את הטקסט של הדוגמה, התווית הסגולה מגיעה מ-CSS
        elements.detailExample.textContent = useCase.example || 'אין דוגמה זמינה.';
        elements.detailExample.style.display = useCase.example ? 'block' : 'none'; // הסתר אם אין דוגמה


        // Related items (same as v4)
        if (elements.relatedList && elements.relatedContainer) {
            elements.relatedList.innerHTML = '';
            let foundRelated = false;
            if (useCase.related && Array.isArray(useCase.related)) {
                useCase.related.forEach(relatedId => {
                    const relatedUseCase = aiUseCases.find(uc => uc.id === relatedId);
                    if (relatedUseCase) {
                        foundRelated = true;
                        const li = document.createElement('li');
                        const link = document.createElement('a');
                        link.textContent = `${relatedUseCase.id}. ${relatedUseCase.title}`;
                        link.href = "#";
                        const showRelatedDetails = (e) => { e.preventDefault(); showDetails(relatedId); };
                        link.addEventListener('click', showRelatedDetails);
                        link.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') showRelatedDetails(e); });
                        li.appendChild(link);
                        elements.relatedList.appendChild(li);
                    }
                });
            }
            elements.relatedContainer.style.display = foundRelated ? 'block' : 'none';
        }

        updateFavoriteButtonAppearance(useCase.id);
        if(elements.favoriteBtn) elements.favoriteBtn.style.visibility = 'visible';
    }

    function hideDetails() { /* (Same as v4) */
        if (!elements.detailPanel) return;
        elements.detailPanel.classList.remove('visible');
        elements.detailPanel.setAttribute('aria-hidden', 'true');
        currentUseCaseId = null;
     }

    // --- Favorites Logic ---
    function updateFavoriteButtonAppearance(id) {
        if (!elements.favoriteBtn) return;
        const useCaseIdNum = parseInt(id, 10);
        const isFav = favorites.includes(useCaseIdNum);
        // *** תיקון טעות כתיב: "הסר" במקום "הוסר" ***
        elements.favoriteBtn.innerHTML = isFav ? '⭐ הסר מהמועדפים' : '⭐ הוסף למועדפים';
        elements.favoriteBtn.classList.toggle('is-favorite', isFav);
        elements.favoriteBtn.setAttribute('aria-pressed', isFav.toString());
        elements.favoriteBtn.setAttribute('aria-label', isFav ? 'הסר מהמועדפים' : 'הוסף למועדפים');
    }

    function toggleFavorite() { /* (Same logic as v4, but relying on fixed updateCardsVisualState) */
        if (currentUseCaseId === null || !elements.favoriteBtn) return;
        const index = favorites.indexOf(currentUseCaseId);
        const cardElement = allCards.find(card => card && parseInt(card.dataset.id) === currentUseCaseId);

        if (index > -1) {
            favorites.splice(index, 1);
            if(cardElement) cardElement.classList.remove('is-favorite');
            displayStatusMessage(`שימוש ${currentUseCaseId} הוסר מהמועדפים.`);
        } else {
            favorites.push(currentUseCaseId);
             if(cardElement) cardElement.classList.add('is-favorite');
             displayStatusMessage(`שימוש ${currentUseCaseId} נוסף למועדפים.`);
        }
        saveFavorites();
        updateFavoriteButtonAppearance(currentUseCaseId);

        // *** תיקון באג קטגוריה: עדכון מלא של המצב החזותי אחרי שינוי ***
        // זה יסתיר/יציג את הכרטיסיה הספציפית אם נמצאים במצב מועדפים
        updateCardsVisualState();
        updateFavoritesButtonVisualState();
    }

    // --- Filtering and Visual State ---
    function updateCardsVisualState() {
        if (!elements.studioDashboard || !Array.isArray(allCards)) return;
        const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase().trim() : "";
        let hasVisibleCardsOverall = false;

        allCards.forEach(card => {
            if (!card) return; // Safety check
            const id = parseInt(card.dataset.id);
            const useCase = aiUseCases.find(uc => uc.id === id);
            if (!useCase) { card.classList.add('card-hidden'); return; }; // Hide if data missing

            const isFavorite = favorites.includes(id);
            card.classList.toggle('is-favorite', isFavorite);

            const categoryText = (useCase.category || '').toLowerCase();
            const titleText = (useCase.title || '').toLowerCase();
            const descriptionText = (useCase.description || '').toLowerCase();
            const exampleText = (useCase.example || '').toLowerCase();

            const isMatch = searchTerm === '' ||
                            titleText.includes(searchTerm) || descriptionText.includes(searchTerm) ||
                            exampleText.includes(searchTerm) || categoryText.includes(searchTerm) ||
                            useCase.id.toString() === searchTerm;

            const shouldBeVisible = isMatch && (!showingFavorites || isFavorite);

            // *** שימוש בקלאס להסתרה במקום display:none ישירות ***
            card.classList.toggle('card-hidden', !shouldBeVisible);
            card.classList.toggle('highlight', shouldBeVisible && searchTerm !== '');

            if (shouldBeVisible) hasVisibleCardsOverall = true;
        });

        // הצג/הסתר אזורי קטגוריה
        document.querySelectorAll('.category-zone').forEach(zone => {
             const visibleCardsInSection = zone.querySelectorAll('.inspiration-card:not(.card-hidden)');
             zone.style.display = visibleCardsInSection.length > 0 ? 'flex' : 'none';
        });

        // הודעת "אין תוצאות"
        const existingNoResultsMsg = elements.studioDashboard.querySelector('.no-results-message');
        if (!hasVisibleCardsOverall && allCards.length > 0) {
             if (!existingNoResultsMsg) {
                 const msgElement = document.createElement('p');
                 msgElement.className = 'no-results-message loading-message';
                 elements.studioDashboard.appendChild(msgElement);
             }
             const msgText = showingFavorites
                ? (favorites.length > 0 ? "אין מועדפים התואמים את החיפוש." : "עדיין לא הוספת מועדפים ⭐")
                : "לא נמצאו שימושים התואמים את החיפוש.";
             elements.studioDashboard.querySelector('.no-results-message').textContent = msgText;
             elements.studioDashboard.querySelector('.no-results-message').style.display = 'block';
         } else {
             if (existingNoResultsMsg) existingNoResultsMsg.remove();
         }
    }

    function handleSearch() { updateCardsVisualState(); }
    function toggleFavoritesView() { showingFavorites = !showingFavorites; updateFavoritesButtonVisualState(); updateCardsVisualState(); }
    function updateFavoritesButtonVisualState() { /* (Same as v4) */
        if (!elements.favoritesToggleBtn) return;
        elements.favoritesToggleBtn.classList.toggle('active', showingFavorites);
        elements.favoritesToggleBtn.setAttribute('aria-pressed', showingFavorites.toString());
        const newTitle = showingFavorites ? "הצג את כל השימושים" : "הצג מועדפים בלבד";
        elements.favoritesToggleBtn.title = newTitle;
        elements.favoritesToggleBtn.setAttribute('aria-label', newTitle);
     }

    // --- Setup Event Listeners ---
    function setupEventListeners() { /* (Same as v4, relying on cached elements) */
        if (elements.closePanelBtn) elements.closePanelBtn.addEventListener('click', hideDetails);
        if (elements.favoriteBtn) elements.favoriteBtn.addEventListener('click', toggleFavorite);
        if (elements.searchInput) elements.searchInput.addEventListener('input', handleSearch);
        if (elements.favoritesToggleBtn) elements.favoritesToggleBtn.addEventListener('click', toggleFavoritesView);
        if (elements.appContainer && elements.detailPanel) { /* Close on outside click */
            document.body.addEventListener('click', (event) => { // Listen on body for wider capture
                if (!elements.detailPanel.classList.contains('visible')) return;
                if (!elements.detailPanel.contains(event.target) && !event.target.closest('.inspiration-card') && event.target !== elements.favoritesToggleBtn) {
                     hideDetails();
                }
            }, true); // Use capture
        }
        document.addEventListener('keydown', (e) => { /* Close on Escape */
            if (e.key === 'Escape' && elements.detailPanel && elements.detailPanel.classList.contains('visible')) {
                hideDetails();
            }
         });
     }

    // --- Run Initialization ---
    initializeApp();

}); // End of DOMContentLoaded
