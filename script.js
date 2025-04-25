document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Caching ---
    const elements = {
        appContainer: document.getElementById('app-container'),
        studioDashboard: document.getElementById('studio-dashboard'),
        detailPanel: document.getElementById('detail-panel'),
        panelContentWrapper: document.getElementById('detail-panel')?.querySelector('.panel-content-wrapper'),
        detailContent: document.getElementById('detail-content'),
        panelLoader: document.getElementById('panel-loader'),
        closePanelBtn: document.getElementById('close-panel-btn'),
        detailTitle: document.getElementById('detail-title'),
        detailCategory: document.getElementById('detail-category'),
        detailCategorySpan: document.getElementById('detail-category'), // היעד הוא ה-span
        detailDescription: document.getElementById('detail-description'),
        detailExample: document.getElementById('detail-example'),
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
    const LS_FAVORITES_KEY = 'aiLndFavorites_v3'; // Keep v3 key
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
            handleLoadError('שגיאה חמורה: לא ניתן היה לטעון את רשימת השימושים. בדוק את קובץ data.js.');
            return;
        }

        renderStudioDashboard();
        setupEventListeners();
        updateFavoritesButtonVisualState();

        if (elements.initialLoader) elements.initialLoader.style.display = 'none';
    }

    // --- Helper Functions ---
    function validateDependencies() {
        for (const key in elements) {
            if (!elements[key]) {
                console.error(`Initialization Error: Element with ID/Selector '${key}' not found.`);
                document.body.innerHTML = `<p style="color:red; padding: 20px; text-align:center;">שגיאה קריטית: ${key} לא נמצא.</p>`;
                return false;
            }
        }
        return true;
    }

    function displayStatusMessage(message, type = 'info', duration = 3500) { // משך קצר יותר
        if (!elements.statusMessageContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.className = `status-message ${type}`;
        messageDiv.setAttribute('role', 'alert');

        elements.statusMessageContainer.innerHTML = '';
        elements.statusMessageContainer.appendChild(messageDiv);

        if (duration > 0) {
            setTimeout(() => {
                if(messageDiv.parentNode === elements.statusMessageContainer) { // ודא שזו עדיין אותה הודעה
                    messageDiv.style.transition = 'opacity 0.5s ease';
                    messageDiv.style.opacity = '0';
                    setTimeout(() => messageDiv.remove(), 500);
                }
            }, duration);
        }
    }

    function handleLoadError(message) {
        console.error(message);
        if (elements.initialLoader) elements.initialLoader.style.display = 'none';
        displayStatusMessage(message, 'error', 0);
    }

    function loadFavorites() {
        try {
            const storedFavorites = localStorage.getItem(LS_FAVORITES_KEY);
            favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
            if (!Array.isArray(favorites)) favorites = [];
        } catch (e) { console.error("Error reading favorites:", e); favorites = []; }
    }

    function saveFavorites() {
        try { localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(favorites)); }
        catch (e) { console.error("Error saving favorites:", e); displayStatusMessage('שגיאה בשמירת המועדפים.', 'error');}
    }

    function setupConstants() {
         CATEGORIES = [...new Set(aiUseCases.map(uc => uc.category).filter(Boolean))];
         CATEGORY_ICONS = { /* Icons dictionary (same as v3) */
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
         try { /* Reading CSS colors (same as v3) */
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

    function renderStudioDashboard() {
        if (!elements.studioDashboard) return;
        elements.studioDashboard.innerHTML = ''; // Clear before render
        allCards = []; // Reset card references

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

            groupedUseCases[category].sort((a, b) => a.id - b.id); // Sort by ID

            groupedUseCases[category].forEach(useCase => {
                const card = createInspirationCard(useCase);
                cardGrid.appendChild(card);
                allCards.push(card); // Add card element to the list
            });

            categoryZone.appendChild(cardGrid);
            elements.studioDashboard.appendChild(categoryZone);
        });

        updateCardsVisualState(); // Update visibility based on filters/favorites
    }

     function createCategoryZone(category, index) { /* (same as v3) */
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

    function createInspirationCard(useCase) { /* (same as v3, listener fixed) */
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

        // Attach listeners
        card.addEventListener('click', () => handleCardClick(useCase.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(useCase.id); }
        });

        return card;
    }

    // --- Detail Panel Logic ---
     function handleCardClick(id) {
        if (isLoading || (elements.detailPanel.classList.contains('visible') && currentUseCaseId === id)) {
            return;
        }
        showDetails(id);
     }

    function showDetails(id) {
        if (isLoading || !elements.detailPanel) return;
        const useCaseIdNum = parseInt(id, 10);
        if (isNaN(useCaseIdNum)) return;

        isLoading = true;
        elements.detailPanel.classList.add('loading'); // Show spinner

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

        // Populate content (happens quickly)
        populatePanelContent(useCase);

        // Make panel visible
        elements.detailPanel.setAttribute('aria-hidden', 'false');
        elements.detailPanel.classList.add('visible');

        // Remove loader (can be immediate or slightly delayed)
        // Using a minimal timeout just for visual smoothness if needed
        setTimeout(() => {
            elements.detailPanel.classList.remove('loading');
            isLoading = false;
        }, 50); // Very short delay
    }

    function clearPanelContent() {
        if (!elements.detailTitle) return;
        elements.detailTitle.textContent = '';
        if (elements.detailCategorySpan) elements.detailCategorySpan.textContent = '';
        elements.detailDescription.textContent = '';
        elements.detailExample.textContent = '';
        elements.relatedList.innerHTML = '';
        if (elements.relatedContainer) elements.relatedContainer.style.display = 'none';
        if (elements.favoriteBtn) elements.favoriteBtn.style.visibility = 'hidden';
        // Clear category color from span
        if (elements.detailCategorySpan) {
            elements.detailCategorySpan.style.color = '';
            elements.detailCategorySpan.style.borderBottomColor = '';
        }
    }


    function populatePanelContent(useCase) {
        if (!elements.detailTitle) return;

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
        elements.detailExample.textContent = useCase.example || 'אין דוגמה זמינה.';

        // Related items
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

    function hideDetails() {
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
        elements.favoriteBtn.innerHTML = isFav ? '⭐ הוסר מהמועדפים' : '⭐ הוסף למועדפים';
        elements.favoriteBtn.classList.toggle('is-favorite', isFav);
        elements.favoriteBtn.setAttribute('aria-pressed', isFav.toString());
        elements.favoriteBtn.setAttribute('aria-label', isFav ? 'הסר מהמועדפים' : 'הוסף למועדפים');
    }

    function toggleFavorite() {
        if (currentUseCaseId === null || !elements.favoriteBtn) return;

        const index = favorites.indexOf(currentUseCaseId);
        const cardElement = allCards.find(card => card && parseInt(card.dataset.id) === currentUseCaseId);

        if (index > -1) {
            favorites.splice(index, 1);
            if(cardElement) cardElement.classList.remove('is-favorite'); // Update card visual
            displayStatusMessage(`שימוש ${currentUseCaseId} הוסר מהמועדפים.`);
        } else {
            favorites.push(currentUseCaseId);
             if(cardElement) cardElement.classList.add('is-favorite'); // Update card visual
             displayStatusMessage(`שימוש ${currentUseCaseId} נוסף למועדפים.`);
        }
        saveFavorites();
        updateFavoriteButtonAppearance(currentUseCaseId); // Update button in panel

        // *** תיקון באג קטגוריה שלמה: עדכן רק אם במצב מועדפים ***
        if (showingFavorites) {
            updateCardsVisualState(); // Update dashboard view only if filtering by favorites
        }
        // updateFavoritesButtonVisualState(); // Already called implicitly via toggleFavoritesView if needed
    }

    // --- Filtering and Visual State ---

    function updateCardsVisualState() {
        if (!elements.studioDashboard || !Array.isArray(allCards)) return;
        const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase().trim() : "";
        let hasVisibleCardsOverall = false;

        allCards.forEach(card => {
            if (!card) return;
            const id = parseInt(card.dataset.id);
            const useCase = aiUseCases.find(uc => uc.id === id);
            if (!useCase) return;

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

            card.classList.toggle('card-hidden', !shouldBeVisible); // Use class for hiding
            card.classList.toggle('highlight', shouldBeVisible && searchTerm !== '');

            if (shouldBeVisible) hasVisibleCardsOverall = true;
        });

        // Show/hide category zones based on visible cards within them
        document.querySelectorAll('.category-zone').forEach(zone => {
             const visibleCardsInSection = zone.querySelectorAll('.inspiration-card:not(.card-hidden)');
             zone.style.display = visibleCardsInSection.length > 0 ? 'flex' : 'none';
        });

        // "No results" message handling
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

    function handleSearch() {
        updateCardsVisualState();
    }

    function toggleFavoritesView() {
        showingFavorites = !showingFavorites;
        updateFavoritesButtonVisualState();
        updateCardsVisualState(); // Update the view immediately
    }

    function updateFavoritesButtonVisualState() {
        if (!elements.favoritesToggleBtn) return;
        elements.favoritesToggleBtn.classList.toggle('active', showingFavorites);
        elements.favoritesToggleBtn.setAttribute('aria-pressed', showingFavorites.toString());
        const newTitle = showingFavorites ? "הצג את כל השימושים" : "הצג מועדפים בלבד";
        elements.favoritesToggleBtn.title = newTitle;
        elements.favoritesToggleBtn.setAttribute('aria-label', newTitle);
    }

    // --- Setup Event Listeners ---
    function setupEventListeners() {
        if (elements.closePanelBtn) elements.closePanelBtn.addEventListener('click', hideDetails);
        if (elements.favoriteBtn) elements.favoriteBtn.addEventListener('click', toggleFavorite);
        if (elements.searchInput) elements.searchInput.addEventListener('input', handleSearch);
        if (elements.favoritesToggleBtn) elements.favoritesToggleBtn.addEventListener('click', toggleFavoritesView);

        // Use event delegation for panel closing to handle potential timing issues
        document.body.addEventListener('click', (event) => {
            if (!elements.detailPanel || !elements.detailPanel.classList.contains('visible')) return;

            // Check if the click originated outside the panel content wrapper
            // And also check it wasn't on a card (which might be reopening the panel)
             if (elements.panelContentWrapper && !elements.panelContentWrapper.contains(event.target) && !event.target.closest('.inspiration-card')) {
                 // Check specifically if the click was on the backdrop (detailPanel itself)
                 if (event.target === elements.detailPanel) {
                     hideDetails();
                 }
             }
        }, true); // Use capture phase to potentially catch clicks earlier

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.detailPanel && elements.detailPanel.classList.contains('visible')) {
                hideDetails();
            }
        });
    }

    // --- Run Initialization ---
    // Ensures the script runs only after the basic HTML structure is ready
    initializeApp();

}); // End of DOMContentLoaded
