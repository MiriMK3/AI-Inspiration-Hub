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
    const relatedContainer = document.getElementById('related-container'); // מיכל השימושים הקשורים
    const favoriteBtn = document.getElementById('favorite-btn');
    const searchInput = document.getElementById('search-input');
    const favoritesToggleBtn = document.getElementById('favorites-toggle-btn');

    // --- State ---
    let favorites = JSON.parse(localStorage.getItem('aiLndFavorites')) || [];
    let currentUseCaseId = null;
    let showingFavorites = false;

    // --- Data Check ---
    if (typeof aiUseCases === 'undefined' || !Array.isArray(aiUseCases) || aiUseCases.length === 0) {
        console.error("שגיאה: נתוני aiUseCases לא נטענו או שהקובץ data.js ריק / שגוי.");
        // אפשר להציג הודעה למשתמש במקום כוכבים
        nebulaContainer.innerHTML = '<p style="color: white; text-align: center; margin-top: 50px;">שגיאה בטעינת נתוני השימושים. אנא בדוק את קובץ data.js.</p>';
        return; // עצירת הרצת שאר הסקריפט
    }


    // --- Constants ---
    const CATEGORIES = [...new Set(aiUseCases.map(uc => uc.category))]; // רשימת קטגוריות ייחודיות
    const NUM_CATEGORIES = CATEGORIES.length;
    const NUM_CATEGORY_COLORS = 8; // מספר הצבעים שהגדרנו ב-CSS
    const PADDING = 80; // ריווח משולי המיכל

    // --- Functions ---

    // יצירה ומיקום הכוכבים
    function renderNebula() {
        nebulaContainer.innerHTML = ''; // ניקוי קודם
        const containerWidth = nebulaContainer.clientWidth - PADDING * 2;
        const containerHeight = nebulaContainer.clientHeight - PADDING * 2;

        if (containerWidth <= 0 || containerHeight <= 0) {
             console.warn("מיכל הערפילית קטן מדי או לא נראה, לא ניתן לרנדר כוכבים.");
             setTimeout(renderNebula, 100); // נסה שוב אחרי רגע קט
             return;
        }

        aiUseCases.forEach((useCase) => {
            const starEl = document.createElement('div');
            starEl.classList.add('star');
            starEl.dataset.id = useCase.id;
            starEl.textContent = useCase.id; // הצגת המספר על הכוכב

            // קביעת צבע לפי קטגוריה
            const categoryIndex = CATEGORIES.indexOf(useCase.category);
            // ודא ש-categoryIndex תקין לפני שימוש במודולו
            if (categoryIndex >= 0) {
                 const categoryColorIndex = (categoryIndex % NUM_CATEGORY_COLORS) + 1;
                 starEl.dataset.categoryColor = categoryColorIndex;
            } else {
                console.warn(`קטגוריה לא נמצאה עבור שימוש ${useCase.id}: ${useCase.category}`);
                starEl.dataset.categoryColor = 1; // ברירת מחדל אם הקטגוריה לא תקינה
            }


            // מיקום אקראי בסיסי (ניתן לשפר לפי קטגוריות)
            let top = PADDING + Math.random() * containerHeight;
            let left = PADDING + Math.random() * containerWidth;

            // שיפור קל לקיבוץ ויזואלי: דחיפה קלה לכיוון מסוים לפי קטגוריה
             if (categoryIndex >= 0 && NUM_CATEGORIES > 0) {
                 const angle = (categoryIndex / NUM_CATEGORIES) * 2 * Math.PI;
                 const pushFactor = 0.1; // עד כמה לדחוף מהמרכז
                 // מרכז המיכל
                 const centerX = containerWidth / 2 + PADDING;
                 const centerY = containerHeight / 2 + PADDING;
                 // דחיפה רדיאלית החוצה מהמרכז לכיוון זווית הקטגוריה
                 const pushDistance = Math.min(containerWidth, containerHeight) * pushFactor * (Math.random() * 0.5 + 0.5);
                 left = centerX + Math.cos(angle) * pushDistance + (Math.random() - 0.5) * 50; // הוספת אקראיות קלה
                 top = centerY + Math.sin(angle) * pushDistance + (Math.random() - 0.5) * 50; // הוספת אקראיות קלה
             }

            // וידוא שהכוכב לא יוצא מהגבולות
            top = Math.max(PADDING / 2, Math.min(top, containerHeight + PADDING * 1.5)); // מתיר קצת חריגה
            left = Math.max(PADDING / 2, Math.min(left, containerWidth + PADDING * 1.5)); // מתיר קצת חריגה


            starEl.style.top = `${top}px`;
            starEl.style.left = `${left}px`;
            starEl.setAttribute('title', `${useCase.id}. ${useCase.title}`); // Tooltip

            starEl.addEventListener('click', () => showDetails(useCase.id));
            nebulaContainer.appendChild(starEl);
        });
        // עדכון ויזואלי ראשוני לאחר יצירת הכוכבים
        updateFavoritesVisuals();
        handleSearch(); // החלת מסננים קיימים (חיפוש/מועדפים)
    }

    // הצגת פאנל הפרטים
    function showDetails(id) {
        const useCase = aiUseCases.find(uc => uc.id === id);
        if (!useCase) {
            console.error(`לא נמצא שימוש עם ID=${id}`);
            return;
        }

        currentUseCaseId = id; // שמירת ה-ID הנוכחי

        detailTitle.textContent = `${useCase.id}. ${useCase.title}`;
        detailCategory.textContent = useCase.category || 'לא ידוע'; // ערך ברירת מחדל
        detailDescription.textContent = useCase.description || 'אין תיאור זמין.';
        detailExample.textContent = useCase.example || 'אין דוגמה זמינה.';

        // עדכון צבע קטגוריה בפאנל
        const categoryIndex = CATEGORIES.indexOf(useCase.category);
         if (categoryIndex >= 0) {
             const categoryColorIndex = (categoryIndex % NUM_CATEGORY_COLORS) + 1;
             detailCategory.style.color = `var(--cat-color-${categoryColorIndex})`;
         } else {
             detailCategory.style.color = 'var(--text-color)'; // צבע ברירת מחדל
         }


        // מילוי רשימת שימושים קשורים
        relatedList.innerHTML = '';
        if (useCase.related && Array.isArray(useCase.related) && useCase.related.length > 0) {
            relatedContainer.style.display = 'block';
            useCase.related.forEach(relatedId => {
                const relatedUseCase = aiUseCases.find(uc => uc.id === relatedId);
                if (relatedUseCase) {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.textContent = `${relatedUseCase.id}. ${relatedUseCase.title}`;
                    link.href = "#"; // למנוע התנהגות קישור רגילה
                    link.onclick = (e) => {
                        e.preventDefault();
                        showDetails(relatedId); // פתיחת הפאנל של השימוש הקשור
                    };
                    li.appendChild(link);
                    relatedList.appendChild(li);
                } else {
                     console.warn(`שימוש קשור עם ID=${relatedId} לא נמצא עבור שימוש ${id}`);
                }
            });
        } else {
             relatedContainer.style.display = 'none';
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
        // שמירה ב-localStorage
        try {
             localStorage.setItem('aiLndFavorites', JSON.stringify(favorites));
        } catch (e) {
            console.error("שגיאה בשמירת מועדפים ל-localStorage:", e);
            // אפשר להציג הודעה למשתמש
        }

        updateFavoriteButton(currentUseCaseId);
        updateFavoritesVisuals(); // עדכון מראה הכוכבים בערפילית
    }

    // עדכון ויזואלי לכוכבים שהם מועדפים או מסוננים
    function updateFavoritesVisuals() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        document.querySelectorAll('.star').forEach(starEl => {
            const id = parseInt(starEl.dataset.id);
            const isFavorite = favorites.includes(id);
            const useCase = aiUseCases.find(uc => uc.id === id);

             if (!useCase) return; // למקרה שלא נמצא מסיבה כלשהי

            // בדיקת התאמה לחיפוש
            const isMatch = searchTerm === '' ||
                            useCase.title.toLowerCase().includes(searchTerm) ||
                            useCase.description.toLowerCase().includes(searchTerm) ||
                            useCase.example.toLowerCase().includes(searchTerm) ||
                            useCase.category.toLowerCase().includes(searchTerm) ||
                            useCase.id.toString() === searchTerm;

             // קביעת מצב הדגשה
            if (isFavorite && (!showingFavorites || isMatch) && searchTerm === '') {
                // הדגשת מועדף רק אם אין חיפוש פעיל או אם הוא מתאים לחיפוש במצב "הכל"
                 starEl.classList.add('highlight');
             } else if (isMatch && searchTerm !== '' ) {
                 // הדגשת תוצאת חיפוש (גם אם היא לא מועדף)
                  starEl.classList.add('highlight');
             }
             else {
                starEl.classList.remove('highlight');
             }

             // קביעת מצב עמעום
            if ((showingFavorites && !isFavorite) || (searchTerm !== '' && !isMatch)) {
                 starEl.classList.add('dimmed');
            } else {
                 starEl.classList.remove('dimmed');
            }
        });
    }

    // טיפול בחיפוש (קורא ל-updateFavoritesVisuals לעדכון המראה)
    function handleSearch() {
        updateFavoritesVisuals();
    }

     // החלפת מצב הצגת מועדפים
    function toggleFavoritesView() {
        showingFavorites = !showingFavorites;
        favoritesToggleBtn.classList.toggle('active', showingFavorites);
        // אין צורך לאפס חיפוש כאן, המשתמש יכול לרצות לסנן מועדפים
        // handleSearch(); // יקרא שוב דרך updateFavoritesVisuals
        updateFavoritesVisuals(); // מעדכן את המראה לפי המצב החדש

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

    // סגירת הפאנל בלחיצה מחוצה לו
    document.addEventListener('click', (event) => {
        if (!detailPanel.classList.contains('visible')) return; // הפאנל סגור

        const clickedInsidePanel = detailPanel.contains(event.target);
        const clickedOnStar = event.target.closest('.star'); // האם לחצו על כוכב (או בתוכו)?

        if (!clickedInsidePanel && !clickedOnStar) {
             hideDetails();
        }
    });

     // רינדור ראשוני של הכוכבים
     // עדיף לקרוא לזה אחרי שהדף וה-CSS נטענו במלואם כדי לקבל מידות נכונות
     window.addEventListener('load', () => {
          renderNebula();
          // ודא שגם המידות תקינות אם יש טעינה עצלה של CSS
          setTimeout(renderNebula, 100);
     });


    // טיפול בשינוי גודל חלון
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderNebula, 250); // רינדור מחדש עם דיליי קצר
    });

});
