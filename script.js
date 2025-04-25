document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const nebulaContainer = document.getElementById('nebula-container');
    const detailPanel = document.getElementById('detail-panel');
    const detailContent = document.getElementById('detail-content'); // אזור הגלילה
    const closePanelBtn = document.getElementById('close-panel-btn');
    const detailTitle = document.getElementById('detail-title');
    const detailCategory = document.getElementById('detail-category');
    const detailDescription = document.getElementById('detail-description');
    const detailExample = document.getElementById('detail-example');
    const relatedList = document.getElementById('related-list');
    const favoriteBtn = document.getElementById('favorite-btn');
    const searchInput = document.getElementById('search-input');
    const favoritesToggleBtn = document.getElementById('favorites-toggle-btn');

    // --- State ---
    let favorites = JSON.parse(localStorage.getItem('aiLndFavorites')) || [];
    let currentUseCaseId = null;
    let showingFavorites = false;

    // --- Constants ---
    const CATEGORIES = [...new Set(aiUseCases.map(uc => uc.category))]; // רשימת קטגוריות ייחודיות
    const NUM_CATEGORIES = CATEGORIES.length;
    const PADDING = 80; // ריווח משולי המיכל

    // --- Functions ---

    // יצירה ומיקום הכוכבים
    function renderNebula() {
        nebulaContainer.innerHTML = ''; // ניקוי קודם
        const containerWidth = nebulaContainer.clientWidth - PADDING * 2;
        const containerHeight = nebulaContainer.clientHeight - PADDING * 2;

        aiUseCases.forEach((useCase, index) => {
            const starEl = document.createElement('div');
            starEl.classList.add('star');
            starEl.dataset.id = useCase.id;
            starEl.textContent = useCase.id; // הצגת המספר על הכוכב

            // קביעת צבע לפי קטגוריה
            const categoryIndex = CATEGORIES.indexOf(useCase.category);
            const categoryColorIndex = (categoryIndex % 8) + 1; // דוגמה ל-8 צבעים, מחזוריות
            starEl.dataset.categoryColor = categoryColorIndex;

            // מיקום אקראי בסיסי (ניתן לשפר לפי קטגוריות)
            let top = PADDING + Math.random() * containerHeight;
            let left = PADDING + Math.random() * containerWidth;

            // שיפור קל לקיבוץ ויזואלי: דחיפה קלה לכיוון מסוים לפי קטגוריה
            const angle = (categoryIndex / NUM_CATEGORIES) * 2 * Math.PI;
            const pushFactor = 0.1; // עד כמה לדחוף מהמרכז
            left += Math.cos(angle) * containerWidth * pushFactor * (Math.random() * 0.5 + 0.5) ;
            top += Math.sin(angle) * containerHeight * pushFactor * (Math.random() * 0.5 + 0.5) ;

            // וידוא שהכוכב לא יוצא מהגבולות
            top = Math.max(PADDING, Math.min(top, containerHeight + PADDING));
            left = Math.max(PADDING, Math.min(left, containerWidth + PADDING));


            starEl.style.top = `${top}px`;
            starEl.style.left = `${left}px`;
            starEl.setAttribute('title', `${useCase.id}. ${useCase.title}`); // Tooltip

            starEl.addEventListener('click', () => showDetails(useCase.id));
            nebulaContainer.appendChild(starEl);
        });
        updateFavoritesVisuals(); // עדכון ראשוני לכוכבים מועדפים
    }

    // הצגת פאנל הפרטים
    function showDetails(id) {
        const useCase = aiUseCases.find(uc => uc.id === id);
        if (!useCase) return;

        currentUseCaseId = id; // שמירת ה-ID הנוכחי

        detailTitle.textContent = `${useCase.id}. ${useCase.title}`;
        detailCategory.textContent = useCase.category;
        detailDescription.textContent = useCase.description;
        detailExample.textContent = useCase.example;

        // עדכון צבע קטגוריה בפאנל
        const categoryIndex = CATEGORIES.indexOf(useCase.category);
        const categoryColorIndex = (categoryIndex % 8) + 1;
        detailCategory.style.color = `var(--cat-color-${categoryColorIndex})`;


        // מילוי רשימת שימושים קשורים
        relatedList.innerHTML = '';
        if (useCase.related && useCase.related.length > 0) {
            document.getElementById('related-container').style.display = 'block';
            useCase.related.forEach(relatedId => {
                const relatedUseCase = aiUseCases.find(uc => uc.id === relatedId);
                if (relatedUseCase) {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.textContent = `${relatedUseCase.id}. ${relatedUseCase.title}`;
                    link.onclick = (e) => {
                        e.preventDefault(); // למנוע ברירת מחדל אם יש
                        showDetails(relatedId); // פתיחת הפאנל של השימוש הקשור
                    };
                    li.appendChild(link);
                    relatedList.appendChild(li);
                }
            });
        } else {
             document.getElementById('related-container').style.display = 'none';
        }


        // עדכון כפתור מועדפים
        updateFavoriteButton(id);

        detailPanel.classList.add('visible');
        detailContent.scrollTop = 0; // גלילה לראש הפאנל בפתיחה
    }

    // הסתרת פאנל הפרטים
    function hideDetails() {
        detailPanel.classList.remove('visible');
        currentUseCaseId = null;
    }

    // עדכון מראה כפתור המועדפים בפאנל
    function updateFavoriteButton(id) {
         if (favorites.includes(id)) {
            favoriteBtn.textContent = '⭐ הוסר מהמועדפים';
            favoriteBtn.classList.add('is-favorite');
        } else {
            favoriteBtn.textContent = '⭐ הוסף למועדפים';
            favoriteBtn.classList.remove('is-favorite');
        }
    }

     // הוספה/הסרה ממועדפים
    function toggleFavorite() {
        if (currentUseCaseId === null) return;

        const index = favorites.indexOf(currentUseCaseId);
        if (index > -1) {
            favorites.splice(index, 1); // הסרה
        } else {
            favorites.push(currentUseCaseId); // הוספה
        }
        localStorage.setItem('aiLndFavorites', JSON.stringify(favorites));
        updateFavoriteButton(currentUseCaseId);
        updateFavoritesVisuals(); // עדכון מראה הכוכבים בערפילית
    }

    // עדכון ויזואלי לכוכבים שהם מועדפים
    function updateFavoritesVisuals() {
        document.querySelectorAll('.star').forEach(starEl => {
            const id = parseInt(starEl.dataset.id);
            if (favorites.includes(id)) {
                starEl.classList.add('highlight'); // שימוש בקלאס הקיים או יצירת קלאס ייעודי
            } else {
                 starEl.classList.remove('highlight');
            }
             // טיפול במצב הצגת מועדפים בלבד
             if (showingFavorites && !favorites.includes(id)) {
                 starEl.classList.add('dimmed');
             } else if (!searchInput.value) { // להסיר עמעום רק אם אין חיפוש פעיל
                 starEl.classList.remove('dimmed');
             }
        });
    }

    // טיפול בחיפוש
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        document.querySelectorAll('.star').forEach(starEl => {
            const id = parseInt(starEl.dataset.id);
            const useCase = aiUseCases.find(uc => uc.id === id);
            const isMatch = searchTerm === '' ||
                            useCase.title.toLowerCase().includes(searchTerm) ||
                            useCase.description.toLowerCase().includes(searchTerm) ||
                            useCase.example.toLowerCase().includes(searchTerm) ||
                            useCase.category.toLowerCase().includes(searchTerm) ||
                            useCase.id.toString() === searchTerm; // לאפשר חיפוש לפי מספר

            // עמעום אם לא מתאים וגם לא במצב הצגת מועדפים בלבד
            if (!isMatch && !showingFavorites) {
                 starEl.classList.add('dimmed');
                 starEl.classList.remove('highlight'); // להסיר הדגשת מועדף אם לא מתאים לחיפוש
            } else if (!showingFavorites || favorites.includes(id)) { // להסיר עמעום אם מתאים לחיפוש או במצב מועדפים
                starEl.classList.remove('dimmed');
                 // להחזיר הדגשה אם הוא מועדף ומתאים לחיפוש (או אין חיפוש)
                 if(favorites.includes(id)) {
                    starEl.classList.add('highlight');
                 }
            } else {
                 // אם במצב הצגת מועדפים בלבד, והוא לא מועדף, שישאר מעומעם
                 starEl.classList.add('dimmed');
            }
        });
    }

     // החלפת מצב הצגת מועדפים
    function toggleFavoritesView() {
        showingFavorites = !showingFavorites;
        favoritesToggleBtn.classList.toggle('active', showingFavorites); // (צריך להוסיף סטייל ל-active אם רוצים)
        searchInput.value = ''; // איפוס חיפוש כשמחליפים מצב
        handleSearch(); // מפעיל מחדש את הלוגיקה של העמעום/הדגשה
        updateFavoritesVisuals(); // מוודא שהכוכבים הנכונים מודגשים/מעומעמים
         if(showingFavorites) {
            favoritesToggleBtn.title = "הצג את כל השימושים";
         } else {
            favoritesToggleBtn.title = "הצג מועדפים בלבד";
         }
    }


    // --- Event Listeners ---
    closePanelBtn.addEventListener('click', hideDetails);
    favoriteBtn.addEventListener('click', toggleFavorite);
    searchInput.addEventListener('input', handleSearch);
    favoritesToggleBtn.addEventListener('click', toggleFavoritesView);

    // סגירת הפאנל בלחיצה מחוצה לו (אופציונלי)
    document.addEventListener('click', (event) => {
        if (detailPanel.classList.contains('visible') &&
            !detailPanel.contains(event.target) &&
            !event.target.classList.contains('star')) {
           // ודא שהלחיצה לא הייתה על כוכב אחר שפותח את הפאנל מחדש
           const clickedStar = event.target.closest('.star');
           if(!clickedStar) {
                hideDetails();
           }
        }
    });

     // רינדור ראשוני של הכוכבים
    renderNebula();

    // טיפול בשינוי גודל חלון (רינדור מחדש למיקומים) - אופציונלי לשיפור
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderNebula, 250); // רינדור מחדש עם דיליי קצר
    });

});