document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const studioLayout = document.getElementById('studio-layout');
    const detailPanel = document.getElementById('detail-panel');
    const detailContent = document.getElementById('detail-content'); // אזור הגלילה
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

    // --- State ---
    let favorites = JSON.parse(localStorage.getItem('aiLndFavorites_v2')) || []; // מפתח חדש למניעת התנגשות
    let currentUseCaseId = null;
    let showingFavorites = false;
    let allCards = []; // מערך לשמירת כל אלמנטי הכרטיסיות

    // --- Data Check ---
    if (typeof aiUseCases === 'undefined' || !Array.isArray(aiUseCases) || aiUseCases.length === 0) {
        console.error("שגיאה: נתוני aiUseCases לא נטענו או שהקובץ data.js ריק / שגוי.");
        if (loadingMessage) {
            loadingMessage.textContent = 'שגיאה בטעינת נתוני השימושים. אנא בדוק את קובץ data.js.';
            loadingMessage.style.color = 'red';
        }
        return; // עצירת הרצת שאר הסקריפט
    }

    // --- Constants & Initial Setup ---
    const CATEGORIES = [...new Set(aiUseCases.map(uc => uc.category))]; // רשימת קטגוריות ייחודיות
    const NUM_CATEGORY_COLORS = 8; // מספר הצבעים שהגדרנו ב-CSS
     // אייקונים לקטגוריות (דוגמה, ניתן להרחיב או לשנות)
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
        "גיוס וקליטה": "🤝",
        "ניהול ושימור ידע ארגוני": "💾",
        "למידה מתמשכת ופיתוח קריירה": "🚀",
        "מודלים פדגוגיים מתקדמים": "🎓",
        "AI ייעודי להדרכה": "🤖",
        "יצירתיות, חדשנות ותכנון אסטרטגי": "💡",
        "תמיכה והכלה": "❤️",
        "ניהול פרויקטים והכשרת סגל": "📋",
        "שימושים מתקדמים ועתידיים": "🔮"
        // ברירת מחדל אם אין התאמה
    };
    const DEFAULT_ICON = "✨";

    // --- Functions ---

    // יצירת מבנה הסטודיו והכרטיסיות
    function renderStudioLayout() {
        if (!studioLayout) {
            console.error("Element #studio-layout not found!");
            return;
        }
        studioLayout.innerHTML = ''; // ניקוי קודם
        allCards = []; // איפוס מערך הכרטיסיות

        // קיבוץ השימושים לפי קטגוריה
        const groupedUseCases = aiUseCases.reduce((acc, useCase) => {
            const category = useCase.category || 'אחר'; // קטגורית ברירת מחדל
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(useCase);
            return acc;
        }, {});

        // יצירת סקשן לכל קטגוריה
        CATEGORIES.forEach((category, index) => {
            if (!groupedUseCases[category] || groupedUseCases[category].length === 0) {
                return; // דלג על קטגוריות ריקות
            }

            const categorySection = document.createElement('section');
            categorySection.classList.add('category-section');

            // קביעת צבע הגבול העליון
            const categoryColorIndex = (index % NUM_CATEGORY_COLORS) + 1;
            categorySection.dataset.categoryColor = categoryColorIndex;

            // הוספת כותרת הקטגוריה עם אייקון
            const categoryTitle = document.createElement('h2');
            const iconSpan = document.createElement('span');
            iconSpan.classList.add('category-icon');
            iconSpan.textContent = CATEGORY_ICONS[category] || DEFAULT_ICON; // שימוש באייקון או ברירת מחדל
            categoryTitle.appendChild(iconSpan);
            categoryTitle.appendChild(document.createTextNode(category)); // הוספת טקסט הכותרת
            categorySection.appendChild(categoryTitle);

            // יצירת מיכל לכרטיסיות
            const cardContainer = document.createElement('div');
            cardContainer.classList.add('card-container');

            // יצירת כרטיסייה לכל שימוש בקטגוריה
            groupedUseCases[category].forEach(useCase => {
                const card = createInspirationCard(useCase);
                cardContainer.appendChild(card);
                allCards.push(card); // הוספה למערך הכללי
            });

            categorySection.appendChild(cardContainer);
            studioLayout.appendChild(categorySection);
        });

         // הסרת הודעת הטעינה
        if(loadingMessage) loadingMessage.style.display = 'none';

        // עדכון ויזואלי ראשוני לאחר יצירת הכרטיסיות
        updateCardsVisualState();
    }

    // יצירת אלמנט כרטיסייה בודדת
    function createInspirationCard(useCase) {
        const card = document.createElement('div');
        card.classList.add('inspiration-card');
        card.dataset.id = useCase.id;
        card.dataset.category = useCase.category || 'אחר';

        // כותרת הכרטיסיה (ID + Title)
        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header');

        const cardId = document.createElement('span');
        cardId.classList.add('card-id');
        cardId.textContent = useCase.id;

        const cardTitle = document.createElement('h3');
        cardTitle.classList.add('card-title');
        cardTitle.textContent = useCase.title;

        const favoriteIndicator = document.createElement('span');
        favoriteIndicator.classList.add('card-favorite-indicator');
        favoriteIndicator.textContent = '⭐'; // כוכב קטן

        cardHeader.appendChild(cardId);
        cardHeader.appendChild(cardTitle);
        cardHeader.appendChild(favoriteIndicator); // הוספת הכוכב הקטן

        card.appendChild(cardHeader);

        // הוספת מאזין לחיצה לפתיחת פרטים
        card.addEventListener('click', () => showDetails(useCase.id));

        return card;
    }


    // הצגת פאנל הפרטים (דומה לקודם)
    function showDetails(id) {
        const useCase = aiUseCases.find(uc => uc.id === id);
        if (!useCase) {
            console.error(`לא נמצא שימוש עם ID=${id}`);
            return;
        }

        currentUseCaseId = id;

        detailTitle.textContent = `${useCase.id}. ${useCase.title}`;
        detailCategory.textContent = useCase.category || 'לא ידוע';
        detailDescription.textContent = useCase.description || 'אין תיאור זמין.';
        detailExample.textContent = useCase.example || 'אין דוגמה זמינה.';

        // עדכון צבע הקטגוריה בפאנל
        const categoryIndex = CATEGORIES.indexOf(useCase.category);
        if (categoryIndex >= 0) {
            const categoryColorIndex = (categoryIndex % NUM_CATEGORY_COLORS) + 1;
            detailCategory.style.color = `var(--cat-color-${categoryColorIndex + 10})`; // נשתמש בצבע כהה יותר של הקטגוריה אם קיים, או נצטרך להגדיר
             // אם אין צבעים כהים, אפשר להשתמש ב-var(--primary-color) או צבע קבוע
             detailCategory.style.color = '#555'; // שינוי לצבע אפור כהה קבוע
        } else {
            detailCategory.style.color = '#555';
        }


        // מילוי רשימת שימושים קשורים
        relatedList.innerHTML = '';
        if (useCase.related && Array.isArray(useCase.related) && useCase.related.length > 0) {
            relatedContainer.style.display = 'block';
            let foundRelated = false;
            useCase.related.forEach(relatedId => {
                const relatedUseCase = aiUseCases.find(uc => uc.id === relatedId);
                if (relatedUseCase) {
                    foundRelated = true;
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.textContent = `${relatedUseCase.id}. ${relatedUseCase.title}`;
                    link.href = "#";
                    link.onclick = (e) => {
                        e.preventDefault();
                        showDetails(relatedId);
                    };
                    li.appendChild(link);
                    relatedList.appendChild(li);
                }
            });
             if (!foundRelated) relatedContainer.style.display = 'none';
        } else {
             relatedContainer.style.display = 'none';
        }

        updateFavoriteButton(id);
        detailPanel.classList.add('visible');
        detailContent.scrollTop = 0;
    }

    // הסתרת פאנל הפרטים
    function hideDetails() {
        detailPanel.classList.remove('visible');
        currentUseCaseId = null;
    }

    // עדכון מראה כפתור המועדפים בפאנל
    function updateFavoriteButton(id) {
         if (favorites.includes(id)) {
            favoriteBtn.innerHTML = '⭐ הוסר מהמועדפים'; // שימוש ב-innerHTML כדי להציג את הכוכב
            favoriteBtn.classList.add('is-favorite');
        } else {
            favoriteBtn.innerHTML = '⭐ הוסף למועדפים';
            favoriteBtn.classList.remove('is-favorite');
        }
    }

     // הוספה/הסרה ממועדפים
    function toggleFavorite() {
        if (currentUseCaseId === null) return;
        const index = favorites.indexOf(currentUseCaseId);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(currentUseCaseId);
        }
        try {
             localStorage.setItem('aiLndFavorites_v2', JSON.stringify(favorites));
        } catch (e) {
            console.error("שגיאה בשמירת מועדפים:", e);
        }
        updateFavoriteButton(currentUseCaseId);
        updateCardsVisualState(); // עדכון מראה הכרטיסיות
    }

    // עדכון מצב ויזואלי של כל הכרטיסיות (מועדפים, חיפוש, סינון)
    function updateCardsVisualState() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let hasVisibleCards = false; // לבדוק אם יש מה להציג

        allCards.forEach(card => {
            const id = parseInt(card.dataset.id);
            const useCase = aiUseCases.find(uc => uc.id === id);
            if (!useCase) return;

            const isFavorite = favorites.includes(id);
            card.classList.toggle('is-favorite', isFavorite); // עדכון הקלאס להצגת הכוכב בכרטיסיה

            // בדיקת התאמה לחיפוש
            const isMatch = searchTerm === '' ||
                            useCase.title.toLowerCase().includes(searchTerm) ||
                            useCase.description.toLowerCase().includes(searchTerm) ||
                            useCase.example.toLowerCase().includes(searchTerm) ||
                            useCase.category.toLowerCase().includes(searchTerm) ||
                            useCase.id.toString() === searchTerm;

            // קביעת נראות הכרטיסיה
            const shouldBeVisible = isMatch && (!showingFavorites || isFavorite);
            card.style.display = shouldBeVisible ? '' : 'none'; // הצג/הסתר כרטיסיה

             // הדגשה
            if (shouldBeVisible && searchTerm !== '') {
                 card.classList.add('highlight');
            } else {
                 card.classList.remove('highlight');
            }

            if (shouldBeVisible) {
                hasVisibleCards = true; // מצאנו לפחות כרטיסיה אחת להצגה
            }
        });

         // הצגת/הסתרת קטגוריות שלמות אם הן ריקות אחרי סינון
         document.querySelectorAll('.category-section').forEach(section => {
             const visibleCardsInSection = section.querySelectorAll('.inspiration-card:not([style*="display: none"])');
             section.style.display = visibleCardsInSection.length > 0 ? '' : 'none';
         });


        // הצגת הודעה אם אין תוצאות
        if (!hasVisibleCards && studioLayout) {
             let noResultsMsg = studioLayout.querySelector('.no-results');
             if (!noResultsMsg) {
                noResultsMsg = document.createElement('p');
                noResultsMsg.classList.add('no-results', 'loading'); // שימוש חוזר בקלאס loading לעיצוב
                studioLayout.appendChild(noResultsMsg);
             }
             noResultsMsg.textContent = showingFavorites ? "אין מועדפים להצגה." : "לא נמצאו שימושים התואמים את החיפוש.";
             noResultsMsg.style.display = 'block';
        } else {
            const noResultsMsg = studioLayout.querySelector('.no-results');
            if (noResultsMsg) noResultsMsg.style.display = 'none';
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
        updateCardsVisualState(); // עדכון המראה

         if(showingFavorites) {
            favoritesToggleBtn.title = "הצג את כל השימושים";
         } else {
            favoritesToggleBtn.title = "הצג מועדפים בלבד";
         }
    }


    // --- Event Listeners ---
    closePanelBtn.addEventListener('click', hideDetails);
    favoriteBtn.addEventListener('click', toggleFavorite);
    searchInput.addEventListener('input', handleSearch); // חיפוש בזמן אמת
    favoritesToggleBtn.addEventListener('click', toggleFavoritesView);

    // סגירת הפאנל בלחיצה מחוצה לו (נשאר דומה)
    document.addEventListener('click', (event) => {
        if (!detailPanel.classList.contains('visible')) return;
        const clickedInsidePanel = detailPanel.contains(event.target);
        // שינוי קטן: בדוק אם הלחיצה הייתה על כרטיסיה, לא רק כוכב
        const clickedOnCard = event.target.closest('.inspiration-card');
        if (!clickedInsidePanel && !clickedOnCard) {
             hideDetails();
        }
    });

     // --- Initial Render ---
     window.addEventListener('load', () => {
          renderStudioLayout();
     });


    // טיפול בשינוי גודל חלון - אין צורך ברינדור מחדש בגלל CSS Grid/Flexbox
    // (אלא אם יש לוגיקה מורכבת שתלויה בגודל)

});
