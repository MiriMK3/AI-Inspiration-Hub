document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const appContainer = document.getElementById('app-container');
    const studioDashboard = document.getElementById('studio-dashboard');
    const detailPanel = document.getElementById('detail-panel');
    const panelContentWrapper = detailPanel.querySelector('.panel-content-wrapper');
    const detailContent = document.getElementById('detail-content');
    const panelLoader = document.getElementById('panel-loader');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const detailTitle = document.getElementById('detail-title');
    const detailCategory = document.getElementById('detail-category');
    const detailDescription = document.getElementById('detail-description');
    const detailExample = document.getElementById('detail-example');
    const relatedList = document.getElementById('related-list');
    const relatedContainer = document.getElementById('related-container');
    const favoriteBtn = document.getElementById('favorite-btn');
    const searchInput = document.getElementById('search-input');
    const favoritesToggleBtn = document.getElementById('favorites-toggle-btn');
    const statusMessageContainer = document.getElementById('status-message-container');
    const initialLoader = document.getElementById('initial-loader'); // טוען ראשוני

    // --- State ---
    let favorites = [];
    let currentUseCaseId = null;
    let showingFavorites = false;
    let allCards = [];
    let isLoading = false; // למניעת פתיחת פאנל כפולה

    // --- Constants & Initial Setup ---
    const LS_FAVORITES_KEY = 'aiLndFavorites_v3';
    let CATEGORIES = [];
    let CATEGORY_ICONS = {};
    let categoryColors = [];
    const DEFAULT_ICON = "✨";
    const DEFAULT_CATEGORY_COLOR = '#777'; // אפור כברירת מחדל

    // --- Initialization Function ---
    function initializeApp() {
        if (!checkDependencies()) return; // בדיקת קיום אלמנטים חיוניים

        loadFavorites();
        setupConstants();

        if (typeof aiUseCases === 'undefined' || !Array.isArray(aiUseCases) || aiUseCases.length === 0) {
            handleLoadError('שגיאה חמורה: לא ניתן היה לטעון את רשימת השימושים. בדוק את קובץ data.js.');
            return;
        }

        renderStudioDashboard(); // רינדור ראשוני
        setupEventListeners(); // הגדרת מאזינים
        updateFavoritesButtonVisualState(); // עדכון מראה כפתור המועדפים

        // הסתרת טוען ראשוני
        if (initialLoader) initialLoader.style.display = 'none';
    }

    // --- Helper Functions ---

    function checkDependencies() {
        const requiredElements = [studioDashboard, detailPanel, panelContentWrapper, detailContent, panelLoader, closePanelBtn, detailTitle, detailCategory, detailDescription, detailExample, relatedList, relatedContainer, favoriteBtn, searchInput, favoritesToggleBtn, statusMessageContainer, initialLoader];
        if (requiredElements.some(el => !el)) {
            console.error("שגיאה קריטית: אחד או יותר מאלמנטי ה-DOM הנדרשים לא נמצאו. בדוק את ה-HTML.");
            // אפשר להציג הודעה למשתמש כאן אם רוצים
            return false;
        }
        return true;
    }


    function displayStatusMessage(message, type = 'info', duration = 5000) {
        if (!statusMessageContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.className = `status-message ${type}`;
        messageDiv.setAttribute('role', 'alert'); // נגישות

        // הסרת הודעות קודמות לפני הוספת חדשה
        while (statusMessageContainer.firstChild) {
            statusMessageContainer.removeChild(statusMessageContainer.firstChild);
        }
        statusMessageContainer.appendChild(messageDiv);

        // הסרה אוטומטית
        if (duration > 0) {
            setTimeout(() => {
                messageDiv.style.transition = 'opacity 0.5s ease';
                messageDiv.style.opacity = '0';
                setTimeout(() => messageDiv.remove(), 500);
            }, duration);
        }
    }

    function handleLoadError(message) {
        console.error(message);
        if (initialLoader) initialLoader.style.display = 'none'; // הסתר טוען ראשוני
        displayStatusMessage(message, 'error', 0); // הודעת שגיאה קבועה
    }

    function loadFavorites() {
        try {
            const storedFavorites = localStorage.getItem(LS_FAVORITES_KEY);
            favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
            if (!Array.isArray(favorites)) {
                 favorites = [];
                 console.warn("נתוני מועדפים פגומים, אופס.");
                 localStorage.removeItem(LS_FAVORITES_KEY);
            }
        } catch (e) {
            console.error("שגיאה בקריאת מועדפים:", e);
            favorites = [];
            displayStatusMessage('לא ניתן היה לטעון את המועדפים השמורים.', 'error');
        }
    }

    function saveFavorites() {
        try {
             localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(favorites));
        } catch (e) {
            console.error("שגיאה בשמירת מועדפים:", e);
            displayStatusMessage('שגיאה בשמירת המועדפים.', 'error');
        }
    }

    function setupConstants() {
         CATEGORIES = [...new Set(aiUseCases.map(uc => uc.category).filter(Boolean))];
         CATEGORY_ICONS = { /* אותם אייקונים כמו בקוד הקודם */
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
         try {
            const cssVariables = getComputedStyle(document.documentElement);
            const colorsString = cssVariables.getPropertyValue('--cat-colors').trim();
            if (colorsString) {
                categoryColors = colorsString.split(',').map(color => color.trim());
                if(categoryColors.length < 10) { // ודא שיש מספיק צבעים
                   console.warn("Not enough category colors defined in --cat-colors CSS variable.");
                   categoryColors = [...categoryColors, ...Array(10 - categoryColors.length).fill(DEFAULT_CATEGORY_COLOR)];
                }
            } else { throw new Error("--cat-colors not found"); }
         } catch (e) {
             console.error("Error reading CSS category colors:", e);
             categoryColors = Array(10).fill(DEFAULT_CATEGORY_COLOR);
         }
    }

    // --- Rendering Functions ---

    function renderStudioDashboard() {
        if (!studioDashboard) return;
        studioDashboard.innerHTML = ''; // ניקוי
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
            cardGrid.classList.add('card-grid');

            groupedUseCases[category].forEach(useCase => {
                const card = createInspirationCard(useCase);
                cardGrid.appendChild(card);
                allCards.push(card);
            });

            categoryZone.appendChild(cardGrid);
            studioDashboard.appendChild(categoryZone);
        });

        updateCardsVisualState(); // עדכון מצב ויזואלי
    }

     function createCategoryZone(category, index) {
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

    function createInspirationCard(useCase) {
        const card = document.createElement('div');
        card.className = 'inspiration-card';
        card.dataset.id = useCase.id;
        card.dataset.category = useCase.category || 'אחר';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `שימוש ${useCase.id}: ${useCase.title}`);

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
        cardTitle.textContent = useCase.title;

        cardContent.appendChild(cardId);
        cardContent.appendChild(cardTitle);

        const favoriteIndicator = document.createElement('span');
        favoriteIndicator.className = 'card-favorite-indicator';
        favoriteIndicator.setAttribute('aria-hidden', 'true');
        favoriteIndicator.textContent = '⭐';

        card.appendChild(cardContent);
        card.appendChild(favoriteIndicator);

        // *** תיקון קריטי: הוספת מאזינים כאן ***
        card.addEventListener('click', () => showDetails(useCase.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showDetails(useCase.id);
            }
        });

        return card;
    }

    // --- Detail Panel Logic ---

    function showDetails(id) {
        if (isLoading || !detailPanel) return;
        const useCaseId = parseInt(id, 10); // ודא שזה מספר
        if (isNaN(useCaseId)) {
             console.error("Invalid ID passed to showDetails:", id);
             return;
        }

        isLoading = true;
        detailPanel.classList.add('loading'); // מציג ספינר CSS

        // נקה תוכן ישן וגלול למעלה מיידית
        clearPanelContent();
        if(detailContent) detailContent.scrollTop = 0;


        const useCase = aiUseCases.find(uc => uc.id === useCaseId);
        if (!useCase) {
            console.error(`לא נמצא שימוש עם ID=${useCaseId}`);
            displayStatusMessage(`שגיאה: לא נמצא שימוש מספר ${useCaseId}.`, 'error');
            hideDetails(); // סגור פאנל
            detailPanel.classList.remove('loading'); // הסר טוען
            isLoading = false;
            return;
        }

        currentUseCaseId = useCaseId; // שמור את ה-ID שנפתח

        // פתח את הפאנל
        detailPanel.setAttribute('aria-hidden', 'false');
        detailPanel.classList.add('visible');

        // מילוי התוכן (יכול להתרחש מיד, הספינר יוסר בסוף)
        populatePanelContent(useCase);

        // הסר ספינר טעינה (גם אם אין השהיה מדומה)
        // אפשר להוסיף השהייה קטנה אם רוצים לראות את הספינר לרגע
        setTimeout(() => {
            detailPanel.classList.remove('loading');
            isLoading = false;
        }, 100); // השהייה קצרה
    }


    function clearPanelContent() {
        if (!detailTitle) return; // בדיקה נוספת
        detailTitle.textContent = '';
        detailCategory.textContent = '';
        detailDescription.textContent = '';
        detailExample.textContent = '';
        relatedList.innerHTML = '';
        if (relatedContainer) relatedContainer.style.display = 'none';
        if (favoriteBtn) favoriteBtn.style.visibility = 'hidden'; // הסתר עד שהתוכן מוכן
    }

    function populatePanelContent(useCase) {
        if (!detailTitle) return; // בדיקה

        detailTitle.textContent = `${useCase.id}. ${useCase.title}`;
        const categoryName = useCase.category || 'אחר';
        detailCategory.textContent = categoryName;

        const categoryIndex = CATEGORIES.indexOf(categoryName);
        const categoryColor = categoryColors[categoryIndex % categoryColors.length] || DEFAULT_CATEGORY_COLOR;
        const categorySpan = detailCategory.parentNode.querySelector('span'); // מצא את ה-span
         if (categorySpan) {
             categorySpan.textContent = categoryName; // עדכן את הטקסט של ה-span
             categorySpan.style.color = categoryColor;
             categorySpan.style.borderBottomColor = categoryColor;
         }


        detailDescription.textContent = useCase.description || 'אין תיאור זמין.';
        detailExample.textContent = useCase.example || 'אין דוגמה זמינה.';

        // שימושים קשורים
        relatedList.innerHTML = '';
        let foundRelated = false;
        if (useCase.related && Array.isArray(useCase.related) && useCase.related.length > 0) {
            useCase.related.forEach(relatedId => {
                const relatedUseCase = aiUseCases.find(uc => uc.id === relatedId);
                if (relatedUseCase) {
                    foundRelated = true;
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.textContent = `${relatedUseCase.id}. ${relatedUseCase.title}`;
                    link.href = "#";
                    // שימוש בפונקציה אנונימית נפרדת
                    const showRelatedDetails = (e) => { e.preventDefault(); showDetails(relatedId); };
                    link.addEventListener('click', showRelatedDetails);
                    link.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') showRelatedDetails(e); });
                    li.appendChild(link);
                    relatedList.appendChild(li);
                }
            });
        }
        if(relatedContainer) relatedContainer.style.display = foundRelated ? 'block' : 'none';

        updateFavoriteButtonAppearance(useCase.id); // עדכון מראה כפתור
        if (favoriteBtn) favoriteBtn.style.visibility = 'visible'; // הצג את הכפתור
    }


    function hideDetails() {
        if (!detailPanel) return;
        detailPanel.classList.remove('visible');
        detailPanel.setAttribute('aria-hidden', 'true');
        currentUseCaseId = null;
        // לא מנקה תוכן כאן כדי שהסגירה תהיה חלקה
    }

    // --- Favorites Logic ---

    function updateFavoriteButtonAppearance(id) {
        if (!favoriteBtn) return;
        const useCaseIdNum = parseInt(id, 10); // ודא שזה מספר להשוואה
        const isFav = favorites.includes(useCaseIdNum);
        favoriteBtn.innerHTML = isFav ? '⭐ הוסר מהמועדפים' : '⭐ הוסף למועדפים';
        favoriteBtn.classList.toggle('is-favorite', isFav);
        favoriteBtn.setAttribute('aria-pressed', isFav.toString());
        favoriteBtn.setAttribute('aria-label', isFav ? 'הסר מהמועדפים' : 'הוסף למועדפים');
    }

    function toggleFavorite() {
        if (currentUseCaseId === null) return; // בדוק אם יש ID נוכחי
        const index = favorites.indexOf(currentUseCaseId);
        const cardElement = allCards.find(card => parseInt(card.dataset.id) === currentUseCaseId);

        if (index > -1) { // קיים, הסר
            favorites.splice(index, 1);
            if(cardElement) cardElement.classList.remove('is-favorite');
        } else { // לא קיים, הוסף
            favorites.push(currentUseCaseId);
             if(cardElement) cardElement.classList.add('is-favorite');
        }
        saveFavorites();
        updateFavoriteButtonAppearance(currentUseCaseId); // עדכן כפתור בפאנל

        // עדכן את התצוגה רק אם המשתמש במצב 'הצג מועדפים' והוסר פריט
        if (showingFavorites && index > -1) {
            updateCardsVisualState();
        }
         // עדכון ויזואלי קל לכפתור הראשי אם רשימת המועדפים משתנה
        updateFavoritesButtonVisualState();

    }

    // --- Filtering and Visual State ---

    function updateCardsVisualState() {
        if (!studioDashboard) return; // ודא שהדשבורד קיים
        const searchTerm = searchInput.value.toLowerCase().trim();
        let hasVisibleCardsOverall = false;

        allCards.forEach(card => {
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
                            titleText.includes(searchTerm) ||
                            descriptionText.includes(searchTerm) ||
                            exampleText.includes(searchTerm) ||
                            categoryText.includes(searchTerm) ||
                            useCase.id.toString() === searchTerm;

            const shouldBeVisible = isMatch && (!showingFavorites || isFavorite);

            card.style.display = shouldBeVisible ? '' : 'flex'; // שימוש ב-flex במקום ברירת מחדל
            card.classList.toggle('highlight', shouldBeVisible && searchTerm !== '');

            if (shouldBeVisible) hasVisibleCardsOverall = true;
        });

        // הצג/הסתר אזורי קטגוריה
        document.querySelectorAll('.category-zone').forEach(zone => {
            const visibleCardsInSection = zone.querySelectorAll('.inspiration-card:not([style*="display: none"])');
            zone.style.display = visibleCardsInSection.length > 0 ? 'flex' : 'none'; // שימוש ב-flex
        });

        // הודעת "אין תוצאות"
        const existingNoResultsMsg = studioDashboard.querySelector('.no-results-message');
        if (!hasVisibleCardsOverall && allCards.length > 0) { // בדוק שיש כרטיסיות בכלל
             if (!existingNoResultsMsg) {
                 const msgElement = document.createElement('p');
                 msgElement.className = 'no-results-message loading-message';
                 studioDashboard.appendChild(msgElement);
             }
             studioDashboard.querySelector('.no-results-message').textContent = showingFavorites ? "אין מועדפים התואמים את החיפוש." : "לא נמצאו שימושים התואמים את החיפוש.";
             studioDashboard.querySelector('.no-results-message').style.display = 'block';
         } else {
             if (existingNoResultsMsg) existingNoResultsMsg.remove();
         }
    }


    function handleSearch() {
        updateCardsVisualState();
    }

    function toggleFavoritesView() {
        showingFavorites = !showingFavorites;
        updateFavoritesButtonVisualState(); // עדכון הכפתור הראשי
        updateCardsVisualState(); // עדכון התצוגה
    }

    // עדכון ויזואלי ומצב ARIA לכפתור המועדפים הראשי
    function updateFavoritesButtonVisualState() {
        if (!favoritesToggleBtn) return;
        favoritesToggleBtn.classList.toggle('active', showingFavorites);
        favoritesToggleBtn.setAttribute('aria-pressed', showingFavorites.toString());
        const newTitle = showingFavorites ? "הצג את כל השימושים" : "הצג מועדפים בלבד";
        favoritesToggleBtn.title = newTitle;
        favoritesToggleBtn.setAttribute('aria-label', newTitle);
    }

    // --- Setup Event Listeners ---
    function setupEventListeners() {
        // בדיקה שכל האלמנטים קיימים לפני הוספת מאזינים
        if (closePanelBtn) closePanelBtn.addEventListener('click', hideDetails);
        if (favoriteBtn) favoriteBtn.addEventListener('click', toggleFavorite);
        if (searchInput) searchInput.addEventListener('input', handleSearch);
        if (favoritesToggleBtn) favoritesToggleBtn.addEventListener('click', toggleFavoritesView);

        // סגירת הפאנל בלחיצה מחוץ לו
        document.addEventListener('click', (event) => {
            if (!detailPanel || !detailPanel.classList.contains('visible')) return;
            // ודא שהלחיצה לא היתה על הפאנל, וגם לא על כרטיסיה שפותחת אותו
            if (!detailPanel.contains(event.target) && !event.target.closest('.inspiration-card')) {
                 hideDetails();
            }
        });

        // סגירת הפאנל במקש Escape
         document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && detailPanel && detailPanel.classList.contains('visible')) {
                hideDetails();
            }
         });
    }

    // --- Run Initialization ---
    initializeApp();

}); // End of DOMContentLoaded
