document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const appContainer = document.getElementById('app-container'); // מיכל ראשי
    const studioDashboard = document.getElementById('studio-dashboard');
    const detailPanel = document.getElementById('detail-panel');
    const panelContentWrapper = detailPanel.querySelector('.panel-content-wrapper'); // מיכל פנימי בפאנל
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

    // --- State ---
    let favorites = []; // יאותחל מ-localStorage
    let currentUseCaseId = null;
    let showingFavorites = false;
    let allCards = [];
    let isLoading = false; // למנוע פתיחת פאנל כפולה בזמן טעינה

    // --- Constants & Initial Setup ---
    const LS_FAVORITES_KEY = 'aiLndFavorites_v3'; // מפתח חדש למקרה שרוצים לאפס
    let CATEGORIES = []; // יאוכלס מ-data.js
    let CATEGORY_ICONS = {}; // יאוכלס מ-data.js או ברירות מחדל
    let categoryColors = []; // יאוכלס מה-CSS
    const DEFAULT_ICON = "✨";
    const DEFAULT_CATEGORY_COLOR = '#cccccc'; // צבע אפור כברירת מחדל

    // --- Initialization Function ---
    function initializeApp() {
        loadFavorites();
        setupConstants(); // הגדרת קבועים אחרי שה-DOM מוכן

        if (typeof aiUseCases === 'undefined' || !Array.isArray(aiUseCases) || aiUseCases.length === 0) {
            displayStatusMessage('שגיאה חמורה: לא ניתן היה לטעון את רשימת השימושים.', 'error');
            return;
        }

        renderStudioDashboard();
        setupEventListeners();
        updateFavoritesButtonVisualState(); // עדכון כפתור ראשי
    }

    // --- Helper Functions ---

    function displayStatusMessage(message, type = 'info') {
        if (!statusMessageContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.className = `status-message ${type}`; // Apply type class
        statusMessageContainer.innerHTML = ''; // Clear previous messages
        statusMessageContainer.appendChild(messageDiv);

        // Optional: auto-hide message after a few seconds
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.5s ease';
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 500);
        }, 5000); // Hide after 5 seconds
    }

    function loadFavorites() {
        try {
            favorites = JSON.parse(localStorage.getItem(LS_FAVORITES_KEY)) || [];
            if (!Array.isArray(favorites)) { // בדיקת תקינות
                 favorites = [];
                 console.warn("נתוני מועדפים פגומים ב-localStorage, אופס.");
                 localStorage.removeItem(LS_FAVORITES_KEY); // ניקוי נתונים פגומים
            }
        } catch (e) {
            console.error("שגיאה בקריאת מועדפים מ-localStorage:", e);
            favorites = [];
            displayStatusMessage('לא ניתן היה לטעון את המועדפים השמורים.', 'error');
        }
    }

    function saveFavorites() {
        try {
             localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(favorites));
        } catch (e) {
            console.error("שגיאה בשמירת מועדפים ל-localStorage:", e);
            displayStatusMessage('שגיאה בשמירת המועדפים.', 'error');
        }
    }

    function setupConstants() {
         // אתחול קטגוריות ייחודיות
         CATEGORIES = [...new Set(aiUseCases.map(uc => uc.category).filter(Boolean))];

         // הגדרת אייקונים (ניתן להרחיב)
          CATEGORY_ICONS = {
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

         // קריאת צבעי קטגוריות מ-CSS
         try {
            const cssVariables = getComputedStyle(document.documentElement);
            const colorsString = cssVariables.getPropertyValue('--cat-colors').trim();
            if (colorsString) {
                categoryColors = colorsString.split(',').map(color => color.trim());
            } else {
                 console.warn("--cat-colors CSS variable not found or empty.");
                 categoryColors = Array(10).fill(DEFAULT_CATEGORY_COLOR); // ברירת מחדל אם לא נמצאו
            }
         } catch (e) {
             console.error("Error reading CSS variables:", e);
             categoryColors = Array(10).fill(DEFAULT_CATEGORY_COLOR);
         }
    }

     // --- Rendering Functions ---

    function renderStudioDashboard() {
        if (!studioDashboard) return;
        studioDashboard.innerHTML = ''; // ניקוי לפני רינדור
        allCards = [];

        // קיבוץ לפי קטגוריה
        const groupedUseCases = aiUseCases.reduce((acc, useCase) => {
            const category = useCase.category || 'אחר';
            if (!acc[category]) acc[category] = [];
            acc[category].push(useCase);
            return acc;
        }, {});

        // מיון הקטגוריות לפי הסדר שהוגדר ב-CATEGORIES
         const sortedCategories = CATEGORIES.filter(cat => groupedUseCases[cat]);
         if (groupedUseCases['אחר']) { // הוספת קטגוריית "אחר" בסוף אם קיימת
             sortedCategories.push('אחר');
         }


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
         categoryZone.classList.add('category-zone');
         const categoryColor = categoryColors[index % categoryColors.length] || DEFAULT_CATEGORY_COLOR;
         categoryZone.style.setProperty('--category-color', categoryColor); // הגדרת משתנה לצבע

         const categoryHeader = document.createElement('div');
         categoryHeader.classList.add('category-header');

         const iconSpan = document.createElement('span');
         iconSpan.classList.add('category-icon');
         iconSpan.setAttribute('aria-hidden', 'true');
         iconSpan.textContent = CATEGORY_ICONS[category] || DEFAULT_ICON;

         const categoryTitle = document.createElement('h2');
         categoryTitle.classList.add('category-title');
         categoryTitle.textContent = category;

         categoryHeader.appendChild(iconSpan);
         categoryHeader.appendChild(categoryTitle);
         categoryZone.appendChild(categoryHeader);

         // השהיית אנימציה
         categoryZone.style.animationDelay = `${0.1 + index * 0.05}s`;

         return categoryZone;
     }

    function createInspirationCard(useCase) {
        const card = document.createElement('div');
        card.className = 'inspiration-card';
        card.dataset.id = useCase.id;
        card.dataset.category = useCase.category || 'אחר';
        card.tabIndex = 0; // לנגישות
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `שימוש ${useCase.id}: ${useCase.title}`);

        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';

        const cardId = document.createElement('span');
        cardId.className = 'card-id';
        cardId.textContent = useCase.id;
        // הגדרת צבע רקע ה-ID לפי הקטגוריה
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

        // תיקון קריטי: הוספת Event Listener כאן!
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
        if (isLoading) return; // מניעת פתיחה כפולה
        isLoading = true;
        detailPanel.classList.add('loading'); // הצג ספינר טעינה
        panelLoader.style.opacity = '1';
        panelLoader.style.visibility = 'visible';

        // נקה תוכן קודם (חשוב לפני setTimeout)
        clearPanelContent();

        const useCase = aiUseCases.find(uc => uc.id === id);
        if (!useCase) {
            console.error(`לא נמצא שימוש עם ID=${id}`);
            displayStatusMessage(`שגיאה: לא נמצא שימוש מספר ${id}.`, 'error');
            hideDetails(); // סגור את הפאנל אם השימוש לא נמצא
            isLoading = false;
            detailPanel.classList.remove('loading');
            panelLoader.style.opacity = '0';
            panelLoader.style.visibility = 'hidden';
            return;
        }

        currentUseCaseId = id;
        detailPanel.setAttribute('aria-hidden', 'false');
        detailPanel.classList.add('visible');

        // שימוש ב-requestAnimationFrame לשיפור ביצועים לפני ה-timeout
        requestAnimationFrame(() => {
            setTimeout(() => {
                populatePanelContent(useCase);
                isLoading = false;
                detailPanel.classList.remove('loading');
                 panelLoader.style.opacity = '0';
                 panelLoader.style.visibility = 'hidden';
            }, 250); // השהייה קצרה יותר
        });
    }

    function clearPanelContent() {
        detailTitle.textContent = '';
        detailCategory.textContent = '';
        detailDescription.textContent = '';
        detailExample.textContent = '';
        relatedList.innerHTML = '';
        relatedContainer.style.display = 'none';
        // אין צורך לגעת בכפתור המועדפים כאן
    }

    function populatePanelContent(useCase) {
        detailTitle.textContent = `${useCase.id}. ${useCase.title}`;
        const categoryName = useCase.category || 'אחר';
        detailCategory.textContent = categoryName;

        // קביעת צבע לקטגוריה בפאנל
        const categoryIndex = CATEGORIES.indexOf(categoryName);
        const categoryColor = categoryColors[categoryIndex % categoryColors.length] || DEFAULT_CATEGORY_COLOR;
        detailCategory.style.color = categoryColor;
        // אפשרות: לשנות את צבע הכותרת או אלמנט אחר בפאנל לפי הצבע
        // detailTitle.style.color = categoryColor; // לדוגמה


        detailDescription.textContent = useCase.description || 'אין תיאור זמין.';
        detailExample.textContent = useCase.example || 'אין דוגמה זמינה.';

        // שימושים קשורים
        relatedList.innerHTML = ''; // נקה שוב ליתר ביטחון
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
                    // שימוש בפונקציה אנונימית נפרדת כדי למנוע בעיות scope
                    const showRelatedDetails = (e) => {
                         e.preventDefault();
                         showDetails(relatedId);
                     };
                    link.addEventListener('click', showRelatedDetails);
                    link.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') showRelatedDetails(e); });
                    li.appendChild(link);
                    relatedList.appendChild(li);
                }
            });
        }
        relatedContainer.style.display = foundRelated ? 'block' : 'none';

        updateFavoriteButtonAppearance(currentUseCaseId); // עדכון מראה כפתור המועדפים
        detailContent.scrollTop = 0; // גלול לראש הפאנל
    }

    function hideDetails() {
        detailPanel.classList.remove('visible');
        detailPanel.setAttribute('aria-hidden', 'true');
        currentUseCaseId = null;
        // ניקוי תוכן יכול להיות אופציונלי כאן, אבל טוב לביצועים
        // setTimeout(clearPanelContent, 600); // נקה אחרי שהפאנל נסגר
    }

    // --- Favorites Logic ---

    function updateFavoriteButtonAppearance(id) {
        // תיקון קריטי: בדיקה אם הכפתור קיים
        if (!favoriteBtn) return;

        const isFav = favorites.includes(id);
        favoriteBtn.innerHTML = isFav ? '⭐ הוסר מהמועדפים' : '⭐ הוסף למועדפים';
        favoriteBtn.classList.toggle('is-favorite', isFav);
        favoriteBtn.setAttribute('aria-pressed', isFav);
         favoriteBtn.setAttribute('aria-label', isFav ? 'הסר מהמועדפים' : 'הוסף למועדפים');

    }

     // תיקון קריטי: הוספה/הסרה ממועדפים
    function toggleFavorite() {
        if (currentUseCaseId === null) return;
        const index = favorites.indexOf(currentUseCaseId);
        const cardElement = allCards.find(card => parseInt(card.dataset.id) === currentUseCaseId);

        if (index > -1) { // קיים, אז הסר
            favorites.splice(index, 1);
            if(cardElement) cardElement.classList.remove('is-favorite');
        } else { // לא קיים, אז הוסף
            favorites.push(currentUseCaseId);
             if(cardElement) cardElement.classList.add('is-favorite');
        }
        saveFavorites(); // שמור את המערך המעודכן
        updateFavoriteButtonAppearance(currentUseCaseId); // עדכן את הכפתור בפאנל

        // עדכן את התצוגה אם המשתמש במצב 'הצג מועדפים'
        if (showingFavorites) {
            updateCardsVisualState();
        }
    }

     // --- Filtering and Visual State ---

    function updateCardsVisualState() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let hasVisibleCardsOverall = false;

        allCards.forEach(card => {
            const id = parseInt(card.dataset.id);
            const useCase = aiUseCases.find(uc => uc.id === id);
            if (!useCase) return;

            const isFavorite = favorites.includes(id);
            card.classList.toggle('is-favorite', isFavorite); // עדכון ויזואלי לכרטיסייה

            // בדיקת התאמה לחיפוש (כולל חיפוש בקטגוריה)
             const categoryText = useCase.category ? useCase.category.toLowerCase() : '';
             const isMatch = searchTerm === '' ||
                            useCase.title.toLowerCase().includes(searchTerm) ||
                            (useCase.description && useCase.description.toLowerCase().includes(searchTerm)) ||
                            (useCase.example && useCase.example.toLowerCase().includes(searchTerm)) ||
                            categoryText.includes(searchTerm) ||
                            useCase.id.toString() === searchTerm;

            const shouldBeVisible = isMatch && (!showingFavorites || isFavorite);

            card.style.display = shouldBeVisible ? '' : 'none'; // הצג/הסתר
            card.classList.toggle('highlight', shouldBeVisible && searchTerm !== ''); // הדגשת חיפוש

            if (shouldBeVisible) {
                hasVisibleCardsOverall = true;
            }
        });

        // הצג/הסתר אזורי קטגוריה ריקים
        document.querySelectorAll('.category-zone').forEach(zone => {
            const visibleCardsInSection = zone.querySelectorAll('.inspiration-card:not([style*="display: none"])');
            zone.style.display = visibleCardsInSection.length > 0 ? '' : 'none';
        });

        // הצג/הסתר הודעת "אין תוצאות"
        const existingNoResultsMsg = studioDashboard.querySelector('.no-results-message');
        if (!hasVisibleCardsOverall) {
             if (!existingNoResultsMsg) {
                 const msgElement = document.createElement('p');
                 msgElement.className = 'no-results-message loading-message'; // Reuse style
                 msgElement.textContent = showingFavorites ? "אין מועדפים התואמים את החיפוש." : "לא נמצאו שימושים התואמים את החיפוש.";
                 studioDashboard.appendChild(msgElement);
             } else {
                 existingNoResultsMsg.textContent = showingFavorites ? "אין מועדפים התואמים את החיפוש." : "לא נמצאו שימושים התואמים את החיפוש.";
                 existingNoResultsMsg.style.display = 'block';
             }
         } else {
             if (existingNoResultsMsg) existingNoResultsMsg.remove();
         }
    }

    function handleSearch() {
        updateCardsVisualState();
    }

    function toggleFavoritesView() {
        showingFavorites = !showingFavorites;
        favoritesToggleBtn.classList.toggle('active', showingFavorites);
        favoritesToggleBtn.setAttribute('aria-pressed', showingFavorites); // עדכון ARIA
        updateCardsVisualState(); // עדכון המראה

        if(showingFavorites) {
            favoritesToggleBtn.title = "הצג את כל השימושים";
            favoritesToggleBtn.setAttribute('aria-label', 'הצג את כל השימושים');
         } else {
            favoritesToggleBtn.title = "הצג מועדפים בלבד";
            favoritesToggleBtn.setAttribute('aria-label', 'הצג מועדפים בלבד');
         }
    }

    // עדכון ויזואלי לכפתור המועדפים הראשי
    function updateFavoritesButtonVisualState() {
        favoritesToggleBtn.classList.toggle('active', showingFavorites);
        favoritesToggleBtn.setAttribute('aria-pressed', showingFavorites);
         if(showingFavorites) {
            favoritesToggleBtn.title = "הצג את כל השימושים";
            favoritesToggleBtn.setAttribute('aria-label', 'הצג את כל השימושים');
         } else {
            favoritesToggleBtn.title = "הצג מועדפים בלבד";
            favoritesToggleBtn.setAttribute('aria-label', 'הצג מועדפים בלבד');
         }
    }


    // --- Setup Event Listeners ---
    function setupEventListeners() {
        if (closePanelBtn) closePanelBtn.addEventListener('click', hideDetails);
        if (favoriteBtn) favoriteBtn.addEventListener('click', toggleFavorite); // תיקון: לוודא שהכפתור קיים
        if (searchInput) searchInput.addEventListener('input', handleSearch);
        if (favoritesToggleBtn) favoritesToggleBtn.addEventListener('click', toggleFavoritesView); // תיקון: לוודא שהכפתור קיים

        // סגירת הפאנל בלחיצה מחוצה לו
        appContainer.addEventListener('click', (event) => {
            if (!detailPanel.classList.contains('visible')) return;
            // בדוק אם הלחיצה *לא* היתה בתוך הפאנל עצמו
            if (!detailPanel.contains(event.target)) {
                 hideDetails();
            }
        });

        // סגירת הפאנל במקש Escape
         document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && detailPanel.classList.contains('visible')) {
                hideDetails();
            }
         });
    }

    // --- Run Initialization ---
    initializeApp();

}); // End of DOMContentLoaded
