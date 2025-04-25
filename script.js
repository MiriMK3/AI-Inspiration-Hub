document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const studioDashboard = document.getElementById('studio-dashboard');
    const detailPanel = document.getElementById('detail-panel');
    const detailContent = document.getElementById('detail-content');
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
    const loadingMessage = document.getElementById('loading-message');
    const panelPlaceholders = document.querySelectorAll('#detail-content .detail-placeholder'); // כל הפלייסהולדרים בפאנל

    // --- State ---
    let favorites = JSON.parse(localStorage.getItem('aiLndFavorites_v2')) || [];
    let currentUseCaseId = null;
    let showingFavorites = false;
    let allCards = []; // מערך לשמירת כל אלמנטי הכרטיסיות

    // --- Data Check ---
    if (typeof aiUseCases === 'undefined' || !Array.isArray(aiUseCases) || aiUseCases.length === 0) {
        handleLoadError('שגיאה: נתוני aiUseCases לא נטענו או שקובץ data.js ריק / שגוי.');
        return;
    }

    // --- Constants & Initial Setup ---
    const CATEGORIES = [...new Set(aiUseCases.map(uc => uc.category).filter(Boolean))]; // רשימת קטגוריות ייחודיות (ללא ריקים)
     // אייקונים לקטגוריות (מפתח: שם הקטגוריה, ערך: אמוג'י)
     const CATEGORY_ICONS = {
        "יצירת תוכן לימודי": "📝",
        "הערכה ומדידה": "📊",
        "התאמה אישית (פרסונליזציה)": "⚙️",
        "ניהול ידע ומאגרי מידע": "📚",
        "פיתוח חומרי עזר": "🛠️",
        "הנגשת מידע": "🌐",
        "תקשורת, מעורבות והטמעה": "💬",
        "ניתוח נתונים וקבלת החלטות": "📈",
        "מיומנויות רכות ותרבות ארגונית": "👥",
        "דיגיטציה והטמעת טכנולוגיה": "💻",
        "גיוס וקליטה": "🤝", // שם קטגוריה קצר יותר
        "ניהול ושימור ידע ארגוני": "💾",
        "למידה מתמשכת ופיתוח קריירה": "🚀",
        "מודלים פדגוגיים מתקדמים": "🎓",
        "AI ייעודי להדרכה": "🤖",
        "יצירתיות, חדשנות ותכנון אסטרטגי": "💡",
        "תמיכה והכלה": "❤️", // שם קטגוריה קצר יותר
        "ניהול פרויקטים והכשרת סגל": "📋", // שם קטגוריה קצר יותר
        "שימושים מתקדמים ועתידיים": "🔮",
        "אחר": "✨" // ברירת מחדל
    };
    const DEFAULT_ICON = "✨";
    // קבלת צבעי הקטגוריות מה-CSS (אם הוגדרו)
    const cssVariables = getComputedStyle(document.documentElement);
    const categoryColors = Array.from({ length: 8 }, (_, i) => cssVariables.getPropertyValue(`--cat-color-${i + 1}`).trim());
    const DEFAULT_CATEGORY_COLOR = cssVariables.getPropertyValue('--primary-accent').trim(); // צבע ברירת מחדל


    // --- Functions ---

    function handleLoadError(message) {
        console.error(message);
        if (loadingMessage) {
            loadingMessage.textContent = message;
            loadingMessage.style.color = 'red';
            loadingMessage.style.display = 'block'; // ודא שהוא נראה
        }
    }

    // יצירת מבנה הסטודיו והכרטיסיות
    function renderStudioDashboard() {
        if (!studioDashboard) {
            console.error("Element #studio-dashboard not found!");
            return;
        }
        studioDashboard.innerHTML = ''; // ניקוי קודם
        allCards = [];

        // קיבוץ השימושים לפי קטגוריה
        const groupedUseCases = aiUseCases.reduce((acc, useCase) => {
            const category = useCase.category || 'אחר';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(useCase);
            return acc;
        }, {});

        // יצירת אזור לכל קטגוריה
        CATEGORIES.forEach((category, index) => {
            if (!groupedUseCases[category] || groupedUseCases[category].length === 0) return;

            const categoryZone = document.createElement('div');
            categoryZone.classList.add('category-zone');
            categoryZone.style.setProperty('--category-color', categoryColors[index % categoryColors.length] || DEFAULT_CATEGORY_COLOR); // הגדרת משתנה CSS מקומי לצבע
            categoryZone.style.borderTopColor = categoryColors[index % categoryColors.length] || DEFAULT_CATEGORY_COLOR; // קביעת צבע הגבול

            // הוספת כותרת הקטגוריה עם אייקון
            const categoryHeader = document.createElement('div');
            categoryHeader.classList.add('category-header');

            const iconSpan = document.createElement('span');
            iconSpan.classList.add('category-icon');
            iconSpan.setAttribute('aria-hidden', 'true'); // מטעמי נגישות
            iconSpan.textContent = CATEGORY_ICONS[category] || DEFAULT_ICON;
            iconSpan.style.color = categoryColors[index % categoryColors.length] || DEFAULT_CATEGORY_COLOR; // צביעת האייקון

            const categoryTitle = document.createElement('h2');
            categoryTitle.classList.add('category-title');
            categoryTitle.textContent = category;
            categoryTitle.style.color = categoryColors[index % categoryColors.length] || DEFAULT_CATEGORY_COLOR; // צביעת הכותרת

            categoryHeader.appendChild(iconSpan);
            categoryHeader.appendChild(categoryTitle);
            categoryZone.appendChild(categoryHeader);

            // יצירת גריד לכרטיסיות
            const cardGrid = document.createElement('div');
            cardGrid.classList.add('card-grid');

            // יצירת כרטיסייה לכל שימוש בקטגוריה
            groupedUseCases[category].forEach(useCase => {
                const card = createInspirationCard(useCase);
                cardGrid.appendChild(card);
                allCards.push(card);
            });

            categoryZone.appendChild(cardGrid);
             // הגדרת השהיית אנימציה
             categoryZone.style.animationDelay = `${0.1 + index * 0.05}s`;
            studioDashboard.appendChild(categoryZone);
        });

        if (loadingMessage) loadingMessage.style.display = 'none';
        updateCardsVisualState(); // עדכון ראשוני
    }

    // יצירת אלמנט כרטיסייה בודדת
    function createInspirationCard(useCase) {
        const card = document.createElement('div');
        card.classList.add('inspiration-card');
        card.dataset.id = useCase.id;
        card.dataset.category = useCase.category || 'אחר';
        card.setAttribute('role', 'button'); // נגישות
        card.setAttribute('tabindex', '0'); // מאפשר מיקוד מהמקלדת

        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');

        const cardId = document.createElement('span');
        cardId.classList.add('card-id');
        cardId.textContent = useCase.id;

        const cardTitle = document.createElement('h3');
        cardTitle.classList.add('card-title');
        cardTitle.textContent = useCase.title;

        cardContent.appendChild(cardId);
        cardContent.appendChild(cardTitle);
        card.appendChild(cardContent);

        // מחוון מועדף (מוסתר בהתחלה)
        const favoriteIndicator = document.createElement('span');
        favoriteIndicator.classList.add('card-favorite-indicator');
        favoriteIndicator.setAttribute('aria-hidden', 'true');
        favoriteIndicator.textContent = '⭐';
        card.appendChild(favoriteIndicator);

        // מאזיני אירועים
        card.addEventListener('click', () => showDetails(useCase.id));
        card.addEventListener('keydown', (e) => { // נגישות מקלדת
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // למנוע גלילה עם מקש רווח
                showDetails(useCase.id);
            }
        });

        return card;
    }

    // הצגת פאנל פרטים עם אפקט טעינה
    function showDetails(id) {
        const useCase = aiUseCases.find(uc => uc.id === id);
        if (!useCase) return;

        // הצגת מצב טעינה בפאנל
        panelPlaceholders.forEach(el => el.style.display = 'block');
        detailTitle.textContent = '';
        detailCategory.textContent = '';
        detailDescription.textContent = '';
        detailExample.textContent = '';
        relatedContainer.style.display = 'none';
        favoriteBtn.style.opacity = 0; // הסתרת הכפתור בזמן טעינה

        detailPanel.setAttribute('aria-hidden', 'false');
        detailPanel.classList.add('visible');
        detailContent.scrollTop = 0;
        currentUseCaseId = id;

        // הדמיית טעינה קלה (אפשר להסיר אם רוצים טעינה מיידית)
        setTimeout(() => {
            populatePanelContent(useCase);
            // הסתרת מצב טעינה
            panelPlaceholders.forEach(el => el.style.display = 'none');
            favoriteBtn.style.opacity = 1;
        }, 150); // השהייה קצרה לאפקט
    }

     // מילוי תוכן הפאנל
     function populatePanelContent(useCase) {
        detailTitle.textContent = `${useCase.id}. ${useCase.title}`;
        detailCategory.textContent = useCase.category || 'לא ידוע';
        detailDescription.textContent = useCase.description || 'אין תיאור זמין.';
        detailExample.textContent = useCase.example || 'אין דוגמה זמינה.';

        // צבע קטגוריה (לדוגמה: צבע הרקע של ה-span)
        const categoryIndex = CATEGORIES.indexOf(useCase.category);
        const categoryColor = categoryColors[categoryIndex % categoryColors.length] || DEFAULT_CATEGORY_COLOR;
        // detailCategory.parentElement.style.borderLeftColor = categoryColor; // אפשרות להדגשת קטגוריה
         detailCategory.style.color = categoryColor; // שימוש בצבע לכותרת הקטגוריה


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
                    link.onclick = (e) => { e.preventDefault(); showDetails(relatedId); };
                    link.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDetails(relatedId); } };
                    li.appendChild(link);
                    relatedList.appendChild(li);
                }
            });
        }
        relatedContainer.style.display = foundRelated ? 'block' : 'none';

        updateFavoriteButton(id);
     }


    // הסתרת פאנל הפרטים
    function hideDetails() {
        detailPanel.classList.remove('visible');
        detailPanel.setAttribute('aria-hidden', 'true');
        currentUseCaseId = null;
    }

    // עדכון מראה כפתור המועדפים בפאנל
    function updateFavoriteButton(id) {
         if (favorites.includes(id)) {
            favoriteBtn.innerHTML = '⭐ הוסר מהמועדפים';
            favoriteBtn.classList.add('is-favorite');
            favoriteBtn.setAttribute('aria-label', 'הסר מהמועדפים');
        } else {
            favoriteBtn.innerHTML = '⭐ הוסף למועדפים';
            favoriteBtn.classList.remove('is-favorite');
            favoriteBtn.setAttribute('aria-label', 'הוסף למועדפים');
        }
    }

     // הוספה/הסרה ממועדפים
    function toggleFavorite() {
        if (currentUseCaseId === null) return;
        const index = favorites.indexOf(currentUseCaseId);
        const cardElement = allCards.find(card => parseInt(card.dataset.id) === currentUseCaseId);

        if (index > -1) {
            favorites.splice(index, 1);
            if(cardElement) cardElement.classList.remove('is-favorite');
        } else {
            favorites.push(currentUseCaseId);
             if(cardElement) cardElement.classList.add('is-favorite');
        }
        try {
             localStorage.setItem('aiLndFavorites_v2', JSON.stringify(favorites));
        } catch (e) {
            console.error("שגיאה בשמירת מועדפים:", e);
        }
        updateFavoriteButton(currentUseCaseId);
        // אין צורך לקרוא ל-updateCardsVisualState כאן אם רק משנים את הקלאס בכרטיסיה הספציפית
    }

    // עדכון מצב ויזואלי של כל הכרטיסיות והקטגוריות
    function updateCardsVisualState() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let hasVisibleCardsOverall = false;

        allCards.forEach(card => {
            const id = parseInt(card.dataset.id);
            const useCase = aiUseCases.find(uc => uc.id === id);
            if (!useCase) return;

            const isFavorite = favorites.includes(id);
            card.classList.toggle('is-favorite', isFavorite);

            const isMatch = searchTerm === '' ||
                            useCase.title.toLowerCase().includes(searchTerm) ||
                            (useCase.description && useCase.description.toLowerCase().includes(searchTerm)) ||
                            (useCase.example && useCase.example.toLowerCase().includes(searchTerm)) ||
                            (useCase.category && useCase.category.toLowerCase().includes(searchTerm)) ||
                            useCase.id.toString() === searchTerm;

            const shouldBeVisible = isMatch && (!showingFavorites || isFavorite);

            card.style.display = shouldBeVisible ? '' : 'none';
            card.classList.toggle('highlight', shouldBeVisible && searchTerm !== '');
            card.classList.remove('dimmed'); // הסרת עימעום ישן אם יש

            if (shouldBeVisible) {
                hasVisibleCardsOverall = true;
            }
        });

        // הצגת/הסתרת קטגוריות ריקות
        document.querySelectorAll('.category-zone').forEach(zone => {
            const visibleCardsInSection = zone.querySelectorAll('.inspiration-card:not([style*="display: none"])');
            zone.style.display = visibleCardsInSection.length > 0 ? '' : 'none';
        });

        // הצגת הודעה אם אין תוצאות
         const noResultsMsg = studioDashboard.querySelector('.no-results-message');
         if (!hasVisibleCardsOverall) {
             if (!noResultsMsg) {
                 const msgElement = document.createElement('p');
                 msgElement.classList.add('no-results-message', 'loading-message'); // שימוש חוזר בעיצוב
                 msgElement.textContent = showingFavorites ? "אין מועדפים להצגה." : "לא נמצאו שימושים התואמים את החיפוש.";
                 studioDashboard.appendChild(msgElement);
             } else {
                 noResultsMsg.textContent = showingFavorites ? "אין מועדפים להצגה." : "לא נמצאו שימושים התואמים את החיפוש.";
                 noResultsMsg.style.display = 'block';
             }
         } else {
             if (noResultsMsg) noResultsMsg.remove(); // הסרת ההודעה אם יש תוצאות
         }
    }

    // טיפול בחיפוש
    function handleSearch() {
        updateCardsVisualState();
    }

     // החלפת מצב הצגת מועדפים
    function toggleFavoritesView() {
        showingFavorites = !showingFavorites;
        favoritesToggleBtn.classList.toggle('active', showingFavorites);
        updateCardsVisualState();

        if(showingFavorites) {
            favoritesToggleBtn.title = "הצג את כל השימושים";
            favoritesToggleBtn.setAttribute('aria-label', 'הצג את כל השימושים');
         } else {
            favoritesToggleBtn.title = "הצג מועדפים בלבד";
            favoritesToggleBtn.setAttribute('aria-label', 'הצג מועדפים בלבד');
         }
    }

    // --- Event Listeners ---
    closePanelBtn.addEventListener('click', hideDetails);
    favoriteBtn.addEventListener('click', toggleFavorite);
    searchInput.addEventListener('input', handleSearch); // חיפוש בזמן אמת
    favoritesToggleBtn.addEventListener('click', toggleFavoritesView);

    // סגירת הפאנל בלחיצה מחוצה לו
    document.addEventListener('click', (event) => {
        if (!detailPanel.classList.contains('visible')) return;
        // בדיקה אם הלחיצה היא *מחוץ* לפאנל עצמו
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


    // --- Initial Render ---
    // רינדור ראשוני רק אחרי טעינת כל המשאבים
    window.addEventListener('load', () => {
        if (typeof aiUseCases !== 'undefined' && aiUseCases.length > 0) {
            renderStudioDashboard();
        } else {
            // הודעת השגיאה כבר טופלה בבדיקת הנתונים
        }
    });

}); // End of DOMContentLoaded
