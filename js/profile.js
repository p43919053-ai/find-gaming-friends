const clientId = "3297832364838545643"; 
const clientSecret = "RBX-z6LMMDaBo0ydp7J9OFOkXsUzApdse19dhPeAqGQBmtb2vQT44dlm3Qa_aR-V7xzh";
const redirectUri = "https://cefddyrtn.localto.net";

// Элементы интерфейса
const trigger = document.getElementById('activityTrigger');
const picker = document.getElementById('timePicker');
const grid = document.getElementById('timeGrid');
const textDisplay = document.getElementById('activityText');
const iconDisplay = document.getElementById('statusIcon');

let tempProfileData = null; 
let selectedItems = []; 
let startHour = null;
let endHour = null;
let firstClick = null;
let isDragging = false;
let selectedCountry = ""; // Тут будет храниться код страны (напр. "UA")
let selectedLanguages = [];

// --- ГЛОБАЛЬНІ ФУНКЦІЇ МОДАЛКИ ---
window.toggleDecoModal = function(show) {
    const modal = document.getElementById('deco-modal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
        console.log(show ? "✅ Модалка відкрита" : "✅ Модалка закрита");
    } else {
        console.error("❌ Модалка #deco-modal не знайдена в HTML");
    }
};

// --- ОСНОВНА ІНІЦІАЛІЗАЦІЯ ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Скрипт ініціалізовано!");

    // 1. Кнопка відкриття модалки (Шукаємо за ID)
    const openBtn = document.getElementById('open-deco-modal-btn');
    if (openBtn) {
        openBtn.onclick = (e) => {
            e.preventDefault();
            window.toggleDecoModal(true);
        };
    }

    // 2. Кнопка видалення прикраси
    const removeDecoBtn = document.querySelector('.btn-danger-outline[onclick*="remove"]'); // або додай їй ID
    if (removeDecoBtn) {
        removeDecoBtn.onclick = () => {
            if (openBtn) openBtn.innerHTML = 'Обрати прикрасу';
            localStorage.removeItem('user_decoration');
        };
    }

    // 3. Відео в модалці
    const modal = document.getElementById('deco-modal');
    if (modal) {
        modal.querySelectorAll('.deco-item').forEach(item => {
            const v = item.querySelector('video');
            if (v) {
                item.onmouseenter = () => v.play();
                item.onmouseleave = () => { v.pause(); v.currentTime = 0; };
            }
        });
    }

    // 4. Завантаження даних та Roblox
    loadUserData();
    handleRobloxCallback();
    
    // Перевірка збереженої прикраси
    const savedDeco = localStorage.getItem('user_decoration');
    if (savedDeco) window.applyDecoration(savedDeco);
}); 

document.addEventListener('DOMContentLoaded', () => {
    const emailBtn = document.getElementById('btn-save-email');
    const emailSpan = document.getElementById('edit-secondary-email');

    // 1. Завантаження збереженого email (спочатку з БД через PHP, якщо є, або з localStorage)
    // Краще, щоб PHP при завантаженні сторінки вже вставив email у цей span, 
    // але якщо ви хочете залишити localStorage як резерв:
    const savedLocal = localStorage.getItem('user_secondary_email');
    if (savedLocal && emailSpan.innerText.includes('@') === false) {
        emailSpan.innerText = savedLocal;
    }

    // 2. Логіка збереження при кліку
    if (emailBtn && emailSpan) {
        emailBtn.addEventListener('click', function() {
            // ДЛЯ SPAN ВИКОРИСТОВУЄМО innerText, А НЕ value!
            const newEmail = emailSpan.innerText.trim();

            if (!newEmail || !newEmail.includes('@')) {
                alert("Введіть коректну пошту!");
                return;
            }

            // Змінюємо текст кнопки, щоб видно було процес
            const originalText = emailBtn.innerText;
            emailBtn.innerText = "Зберігаю...";

            // Відправка на сервер
            fetch('update_email.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: newEmail })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Успіх: зберігаємо і в локальне сховище про всяк випадок
                    localStorage.setItem('user_secondary_email', newEmail);
                    alert("Пошту успішно збережено в базі даних!");
                } else {
                    alert("Помилка сервера: " + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Сталася помилка з'єднання.");
            })
            .finally(() => {
                emailBtn.innerText = originalText;
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const userBtn = document.getElementById('btn-save-username');
    const userSpan = document.getElementById('edit-username');

    if (userBtn && userSpan) {
        userBtn.onclick = async () => {
            // Отримуємо текст саме через innerText
            const newName = userSpan.innerText.trim();

            if (!newName) {
                alert("Ім'я не може бути порожнім");
                return;
            }

            const originalText = userBtn.innerText;
            userBtn.innerText = "Зберігаю...";

            try {
                const response = await fetch('update_username.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: newName })
                });

                const data = await response.json();

                if (data.success) {
                    alert("Ім'я оновлено в БД!");
                    // Оновлюємо відображення імені в шапці, якщо треба
                    const topName = document.querySelector('.user-info h2'); 
                    if (topName) topName.innerText = newName;
                } else {
                    alert("Помилка: " + data.message);
                }
            } catch (error) {
                console.error("Помилка запиту:", error);
                alert("Не вдалося зв'язатися з сервером");
            } finally {
                userBtn.innerText = originalText;
            }
        };
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const birthdayBtn = document.getElementById('btn-save-birthday');

    if (birthdayBtn) {
        birthdayBtn.onclick = async () => {
            // Зчитуємо значення, які зараз стоять в інпутах
            const day = document.getElementById('birth-day').value;
            const month = document.getElementById('birth-month').value;
            const year = document.getElementById('birth-year').value;

            birthdayBtn.innerText = "Зберігаю...";

            try {
                const response = await fetch('update_birthday.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        day: day, 
                        month: month, 
                        year: year 
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alert("Дату народження збережено!");
                } else {
                    alert("Помилка: " + data.message);
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Помилка зв'язку з сервером");
            } finally {
                birthdayBtn.innerText = "Підтвердити";
            }
        };
    }
});

window.applyDecoration = function(src) {
    const square = document.querySelector('.transparent-square');
    const openBtn = document.getElementById('open-deco-modal-btn');
    
    // Оновлюємо кнопку
    if (openBtn) {
        openBtn.innerHTML = `<video src="${src}" autoplay loop muted playsinline style="width:20px; height:20px; border-radius:50%; margin-right:10px; vertical-align:middle; object-fit:cover; pointer-events:none;"></video> Обрано`;
    }

    // Оновлюємо квадрат на сторінці
    if (square) {
        square.innerHTML = `<video src="${src}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover; mix-blend-mode:screen; pointer-events:none;"></video>`;
        square.style.display = 'block';
    }

    localStorage.setItem('user_decoration', src);
    window.toggleDecoModal(false);
};

// Функція ПРИМУСОВОГО видалення
console.log("✅ profile.js успішно завантажений!");

// Функція видалення
window.removeDecoration = function() {
    console.log("START: Спроба видалення...");

    // 1. Очищуємо квадрат (використовуємо кілька способів для надійності)
    const square = document.querySelector('.transparent-square');
    if (square) {
        square.innerHTML = ''; 
        square.style.display = 'none';
        console.log("✅ Квадрат .transparent-square очищено");
    }

    // 2. Скидаємо кнопку вибору
    const openBtn = document.getElementById('open-deco-modal-btn');
    if (openBtn) {
        openBtn.innerHTML = 'Обрати прикрасу';
        console.log("✅ Кнопка скинута");
    }

    // 3. Видаляємо з локальної пам'яті
    localStorage.removeItem('user_decoration');
};
//GAMES LIBRARY ---
// type: "badge" for badges, type: "pass" for gamepasses
const myGamesLibrary = [
    {
        name: "Evade",
        img: "img/evade.jpg",
        modes: [
            { id: "2128167319", name: "25 lvl", type: "badge", img: "img/25 evade.jpeg" },
            { id: "2128167321", name: "50 lvl", type: "badge", img: "img/50 evade.jpeg" },
            { id: "2128167324", name: "75 lvl", type: "badge", img: "img/75 evade.jpeg" },
            { id: "2128167328", name: "100 lvl", type: "badge", img: "img/100 evade.jpeg" },
            { id: "2128167329", name: "125 lvl", type: "badge", img: "img/125 evade.jpeg" },
            // Example Gamepass
            { id: "1045160877", name: "Crystalline Set", type: "pass", img: "img/Crystalline Set.jpeg" },
            { id: "1637578813", name: "Dog Set", type: "pass", img: "img/Dog Set.jpeg" },
            { id: "1419753648", name: "Retro Cosmetics Set", type: "pass", img: "img/Retro Cosmetics Set.jpeg" },
            { id: "1045160877", name: "Crystalline Set", type: "pass", img: "img/Crystalline Set.jpeg" }
        ]
    },
    {
        name: "99 nights in the forest",
        img: "img/99 night.jpg",
        modes: [
            { id: "2310366779580636", name: "10 days", type: "badge", img: "im/10 days.jpeg" }
        ]
    }
];

// --- 2. INITIALIZATION ---
// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Скрипт ініціалізовано!");

    const nameInput = document.getElementById('edit-display-name');
    const topNameBlock = document.getElementById('userName');
    const bannerInput = document.getElementById('banner-file-input');
    const trigger = document.getElementById('activityTrigger');
    const grid = document.getElementById('timeGrid');

    // Завантаження даних при старті
    loadUserData();
    initTimeGrid(grid);

    // Слухач банера
    if (bannerInput) {
        bannerInput.addEventListener('change', function() {
            if (this.files[0]) uploadBanner(this.files[0]);
        });
    }

    // Робота з Roblox OAuth\

    // Оновлення статусу кожну хвилину
    setInterval(checkStatus, 60000);
});

// --- ФУНКЦІЇ ПРОФІЛЮ ---
async function loadUserData() {
    console.log("🔄 Завантаження даних профілю...");
    
    // [ДОДАНО] 1. Перевіряємо, чи є ID в посиланні (наприклад profile.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const fetchUrl = userId ? `get_user.php?id=${userId}` : 'get_user.php';

    try {
        // [ЗМІНЕНО] Використовуємо динамічну адресу (свій профіль або чужий)
        const response = await fetch(fetchUrl);
        
        // Перевірка на валідність JSON
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("❌ Сервер повернув не JSON:", text);
            return;
        }
        
        console.table(data); // Перевірка даних в консолі

        if (data.success) {
            const timestamp = Date.now(); 

            // ===========================
            // 1. ВІЗУАЛ (Аватар, Банер, Фон)
            // ===========================
            
            // Аватар
            let avatarPath = data.avatar || data.avatar_url;
            if (avatarPath && avatarPath.length > 3) {
                const src = '/' + avatarPath.replace(/\\/g, '/') + '?t=' + timestamp;
                const av1 = document.getElementById('top-nav-avatar');
                const av2 = document.getElementById('settings-avatar-img');
                if (av1) av1.src = src;
                if (av2) av2.src = src;
            }

            // Банер
            let bannerPath = data.banner || data.banner_url;
            const bannerBlock = document.getElementById('profile-banner-bg');
            if (bannerPath && bannerPath.length > 3 && bannerBlock) {
                const cleanPath = bannerPath.replace(/\\/g, '/');
                const bannerSrc = (cleanPath.startsWith('/') ? '' : '/') + cleanPath + '?t=' + timestamp;
                
                // Встановлюємо стилі, щоб не двоїлося
                bannerBlock.style.backgroundImage = `url("${bannerSrc}")`;
                bannerBlock.style.backgroundSize = 'cover';      // Розтягнути на весь блок
                bannerBlock.style.backgroundPosition = 'center'; // Центрувати
                bannerBlock.style.backgroundRepeat = 'no-repeat'; // НЕ ПОВТОРЮВАТИ (це прибере роздвоєння)
                
                const settingsBanner = document.getElementById('settings-banner-img');
                if (settingsBanner) settingsBanner.src = bannerSrc;
            }

            // Фон сайту
            let siteBgPath = data.background_url;
            if (siteBgPath && siteBgPath.length > 3) {
                const cleanBgPath = siteBgPath.replace(/\\/g, '/');
                const finalBgUrl = (cleanBgPath.startsWith('/') ? '' : '/') + cleanBgPath + '?t=' + timestamp;
                Object.assign(document.body.style, {
                    backgroundImage: `url('${finalBgUrl}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                });
            }

            // ===========================
            // 2. БІОГРАФІЯ
            // ===========================
            const bioInput = document.getElementById('user-bio');
            const bioDisplay = document.getElementById('userBioDisplay');

            if (data.bio !== undefined) {
                const currentBio = data.bio || "";
                if (bioInput) bioInput.value = currentBio;
                if (bioDisplay) {
                    bioDisplay.textContent = currentBio.trim() !== "" ? currentBio : "Про себе нічого не вказано";
                }
                
                if (bioInput) {
                    bioInput.onblur = async () => {
                        const newBio = bioInput.value.trim();
                        if (newBio === data.bio) return;
                        if (typeof saveBioToServer === 'function') {
                            await saveBioToServer(newBio);
                            data.bio = newBio;
                        }
                    };
                }
            }

            

            // ===========================
            // ВСТАВТЕ ЦЕ ВСЕРЕДИНУ loadUserData()
            // ===========================
            
            // 3. ВІДОБРАЖУВАНЕ ІМ'Я (Тільки колонка `user`)
            const displayNameSpan = document.getElementById('edit-display-name');
            const nameHeader = document.getElementById('userName'); 

            // СУВОРА ЛОГІКА:
            // Якщо data.user існує і не пусте — беремо його.
            // Якщо ні — залишаємо пустим (не беремо username!)
            const realName = (data.user && data.user.trim().length > 0) ? data.user : "";

            // Заповнюємо шапку (якщо пусто - пишемо заглушку, але не логін)
            if (nameHeader) {
                nameHeader.textContent = realName || "Без імені"; 
            }

            // Заповнюємо поле налаштувань
            if (displayNameSpan) {
                // Якщо елемент input
                if (displayNameSpan.tagName === 'INPUT') {
                    displayNameSpan.value = realName;
                } else {
                    // Якщо елемент span/div
                    displayNameSpan.innerText = realName;
                }
            }

            // Усередині функції loadUserData, після отримання data від сервера
if (data.success) {
    // 1. Викачуємо та відображаємо дату реєстрації
    const regDateEl = document.getElementById('userRegistrationDate');
    if (regDateEl && data.created_at) {
        // Створюємо об'єкт дати з рядка БД (напр. 2026-02-05)
        const dateObj = new Date(data.created_at);
        
        // Форматуємо дату: "5 лютого 2026 р."
        const formattedDate = dateObj.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        regDateEl.innerText = "На сайті з " + formattedDate;
    }

    // 2. Відображаємо біографію
    const bioTextEl = document.getElementById('userBioText');
    if (bioTextEl) {
        bioTextEl.innerText = data.bio || "Опис відсутній";
    }
}

            // ===========================
            // 4. ЮЗЕРНЕЙМ (Username/Login) - ВИПРАВЛЕНО
            // ===========================
          const usernameSpan = document.getElementById('edit-username');   
            const userHandleDisplay = document.getElementById('userHandle'); 

            // --- 1. ОТОБРАЖЕНИЕ НА СТРАНИЦЕ (При загрузке) ---
            if (userHandleDisplay) {
                if (data.username && data.username.trim() !== "") {
                    // Если есть имя -> ставим его
                    userHandleDisplay.innerText = "@" + data.username;
                    userHandleDisplay.style.color = "#b0b0b0"; 
                } else {
                    // Если имени нет -> ставим заглушку, чтобы блок был виден
                    // Вы можете использовать data.id или просто слово "new"
                    userHandleDisplay.innerText = "@user_new"; 
                }
            }

            

            // --- 2. ЛОГИКА РЕДАКТИРОВАНИЯ ---
            if (usernameSpan) {
                // Вписываем текущий логин или подсказку
                usernameSpan.innerText = data.username || "Введіть логін";

                // Очищаем поле при клике, если там текст-подсказка
                usernameSpan.onfocus = () => {
                    if (usernameSpan.innerText === "Введіть логін") {
                        usernameSpan.innerText = "";
                    }
                };

                // Сохраняем, когда убрали фокус (кликнули в другое место)
                usernameSpan.onblur = async () => {
                    let newLogin = usernameSpan.innerText.trim();
                    
                    // Если пусто или осталось "Введіть логін" -> возвращаем как было
                    if (!newLogin || newLogin === "Введіть логін") {
                        usernameSpan.innerText = data.username || "Введіть логін";
                        return;
                    }
                    
                    // Если ничего не изменилось -> выходим
                    if (newLogin === data.username) return;

                    try {
                        console.log("💾 Отправляю на сервер:", newLogin);
                        
                        // --- ВАЖНОЕ ИЗМЕНЕНИЕ: ИСПОЛЬЗУЕМ PHP ВМЕСТО FIREBASE ---
                        const response = await fetch('update_username.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: newLogin })
                        });
                        
                        const result = await response.json();

                        if (result.success) {
                            console.log("✅ Сохранено успешно!");
                            
                            // Обновляем данные в памяти браузера
                            data.username = newLogin; 

                            // Мгновенно обновляем текст под аватаркой (@username)
                            if (userHandleDisplay) {
                                userHandleDisplay.innerText = "@" + newLogin;
                            }
                        } else {
                            console.error("Ошибка сервера:", result.message);
                            alert("Ошибка: " + result.message);
                            usernameSpan.innerText = data.username; // Возвращаем старое имя
                        }
                        
                    } catch (err) {
                        console.error("❌ Ошибка соединения:", err);
                        alert("Не удалось связаться с сервером.");
                    }
                };
            }

            // ===========================
            // 5. ПОШТА (Email) - ID: edit-secondary-email
            // ===========================
            const emailSpan = document.getElementById('edit-secondary-email');
            const savedEmail = data.secondary_email || "Додати пошту"; 

            if (emailSpan) {
                emailSpan.innerText = savedEmail;

                emailSpan.onfocus = () => {
                    if (emailSpan.innerText === "Додати пошту") emailSpan.innerText = "";
                };

                emailSpan.onblur = async () => {
                    const newEmail = emailSpan.innerText.trim();
                    if (!newEmail) {
                        emailSpan.innerText = data.secondary_email || "Додати пошту";
                        return;
                    }
                    if (newEmail === data.secondary_email) return;

                    try {
                        const res = await fetch('update_email.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: newEmail })
                        });
                        const result = await res.json();
                        if (result.success) {
                            console.log("✅ Email оновлено");
                            data.secondary_email = newEmail;
                        } else {
                            alert("Помилка: " + result.message);
                            emailSpan.innerText = data.secondary_email || "Додати пошту";
                        }
                    } catch (err) {
                        console.error("Помилка збереження email:", err);
                    }
                };
            }

            // ===========================
            // 10. ЗАВАНТАЖЕННЯ БЕЙДЖІВ (БЕЗПЕЧНА ВЕРСІЯ)
            // ===========================
            if (data.badges && data.badges !== null && data.badges.trim() !== "") {
                // Якщо прийшли дані (наприклад "vip,admin")
                const loadedBadges = data.badges.split(',');
                
                // Малюємо
                renderBadgesOnProfile(loadedBadges);

                // Підсвічуємо в модальному вікні
                const modalBadges = document.querySelectorAll('.badge-item');
                modalBadges.forEach(item => {
                    const bName = item.getAttribute('data-badge');
                    if (loadedBadges.includes(bName)) {
                        item.style.borderColor = '#ff4500';
                        item.style.background = '#331a15';
                    } else {
                        item.style.borderColor = '#444';
                        item.style.background = '#222';
                    }
                });
            } else {
                // Якщо прийшло NULL (як зараз)
                console.log("Бейджів ще немає в БД.");
                renderBadgesOnProfile([]); // Очищаємо блок
            }

            const gradLeft = data.grad_color_left || '#000000'; 
            const gradRight = data.grad_color_right || '#ffffff';

            // 2. Знаходимо блок фону
            const mainBlock = document.querySelector('.main-gradient-bg');
            
            // 3. Якщо блок є — застосовуємо стиль
            if (mainBlock) {
                // Саме цей рядок робить магію:
                mainBlock.style.setProperty(
                 'background', 
                 `linear-gradient(135deg, ${gradLeft}, ${gradRight})`, 
                 'important'
                );
            }

            // 4. (Додатково) Якщо це наш профіль — оновлюємо інпути в налаштуваннях
            // Щоб коли ви відкрили меню, там вже стояли актуальні кольори
            const inputL = document.getElementById('color-left');
            const inputR = document.getElementById('color-right');
            if (inputL) inputL.value = gradLeft;
            if (inputR) inputR.value = gradRight;

            // 5. Оновлюємо прев'ю в налаштуваннях (маленький квадратик)
            if (typeof updateGradientPreview === 'function') {
                updateGradientPreview();
            }


            // ===========================
            // 6. КРАЇНИ
            // ===========================
            if (typeof renderUserFlags === 'function') {
                renderUserFlags(data.country_code, data.languages_icons);
            }

            // ===========================
            // 7. ДЕКОРАЦІЇ
            // ===========================
            const savedDeco = localStorage.getItem('user_decoration');
            if (savedDeco && typeof window.applyDecoration === 'function') {
                window.applyDecoration(savedDeco);
            }

            // ===========================
            // [НОВЕ] 9. СТАТУС АКТИВНОСТІ (ЧАС)
            // ===========================
            // Перевіряємо, чи прийшли дані про час з БД
            if (data.status_start_hour !== null && data.status_start_hour !== undefined &&
                data.status_end_hour !== null && data.status_end_hour !== undefined) {
                
                const sHour = parseInt(data.status_start_hour);
                const eHour = parseInt(data.status_end_hour);

                // Оновлюємо глобальні змінні (якщо вони використовуються в інших скриптах)
                if (typeof window.startHour !== 'undefined') window.startHour = sHour;
                if (typeof window.endHour !== 'undefined') window.endHour = eHour;

                // Оновлюємо текст на плашці
                const timeText = document.getElementById('activityText');
                if (timeText) {
                    timeText.innerText = `${sHour}:00 — ${eHour}:00`;
                }

                // Робимо плашку активною (фіолетовою)
                const trigger = document.getElementById('activityTrigger');
                if (trigger) {
                    trigger.classList.add('is-set');
                    
                    // Перевіряємо статус (спить/грає) відносно поточного часу
                    // Ця функція (checkStatus) має бути у вашому коді з "годинником"
                    if (typeof checkStatus === 'function') {
                        // Тимчасово підставляємо значення у глобальні, якщо checkStatus їх бере звідти
                        window.startHour = sHour;
                        window.endHour = eHour;
                        checkStatus();
                    }
                }
            }

            // ===========================
            // 9. СТАТУС АКТИВНОСТІ (ЧАС) - ВИПРАВЛЕНО
            // ===========================
            const timeText = document.getElementById('activityText');
            const trigger = document.getElementById('activityTrigger');

            // Перевіряємо, чи є дані і чи вони не NULL
            if (data.status_start_hour != null && data.status_end_hour != null) {
                
                const sHour = parseInt(data.status_start_hour);
                const eHour = parseInt(data.status_end_hour);

                // Додаткова перевірка: чи вийшли справжні числа (не NaN)
                if (!isNaN(sHour) && !isNaN(eHour)) {
                    
                    // 1. Оновлюємо глобальні змінні
                    if (typeof window.startHour !== 'undefined') window.startHour = sHour;
                    if (typeof window.endHour !== 'undefined') window.endHour = eHour;

                    // 2. Оновлюємо текст (Тільки якщо є числа!)
                    if (timeText) {
                        timeText.innerText = `${sHour}:00 — ${eHour}:00`;
                    }

                    // 3. Робимо плашку активною
                    if (trigger) {
                        trigger.classList.add('is-set');
                        trigger.classList.remove('inactive-now');
                        
                        // Оновлюємо іконку статусу
                        if (typeof checkStatus === 'function') checkStatus();
                    }
                }
            } else {
                // ВАЖЛИВО: Якщо в БД пусто (NULL), повертаємо початковий вигляд
                if (timeText) timeText.innerText = "Додати час активності";
                if (trigger) {
                    trigger.classList.remove('is-set');
                    trigger.classList.add('inactive-now');
                }
            }

            // ===========================
            // [ДОДАНО] 8. РЕЖИМ ПЕРЕГЛЯДУ (Захист від редагування чужого профілю)
            // ===========================
            // Якщо сервер повернув прапорець is_own_profile = false, блокуємо редагування
            if (data.is_own_profile === false) {
                console.log("🔒 Ви переглядаєте чужий профіль. Редагування заборонено.");
                
                // Знаходимо всі елементи, які можна редагувати
                const editables = document.querySelectorAll('[contenteditable="true"]');
                editables.forEach(el => {
                    el.setAttribute('contenteditable', 'false'); // Вимикаємо редагування
                    el.style.pointerEvents = 'none'; // Вимикаємо кліки
                    el.onblur = null; // Видаляємо функцію збереження
                    el.onfocus = null; 
                });

                // Вимикаємо інпути (наприклад, біо)
                if (bioInput) {
                    bioInput.setAttribute('readonly', true);
                    bioInput.onblur = null;
                }

                // Приховуємо кнопки налаштувань (додай клас .owner-only до кнопок в HTML, якщо потрібно)
                const settingsBtns = document.querySelectorAll('.owner-only');
                settingsBtns.forEach(btn => btn.style.display = 'none');
            }

        } else {
            console.error("❌ Сервер повернув помилку:", data.message);
        }
    } catch (err) { 
        console.error("❌ Помилка завантаження даних:", err); 
    }
}

function startRobloxAuth() {
    const authUrl = `https://apis.roblox.com/oauth/v1/authorize?` + 
                    `client_id=${clientId}&` +
                    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                    `scope=openid profile&` +
                    `response_type=code`;
    window.location.href = authUrl;
}

window.toggleDecoModal = function(show) {
    const modal = document.getElementById('deco-modal');
    if (modal) modal.style.display = show ? 'flex' : 'none';
};

async function handleRobloxCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        // Тут має бути твоя логіка авторизації, якщо потрібна
        console.log("Отримано код Roblox:", code);
    }
}
// 
// Функція для оновлення імені
async function updateUserName() {
    const nameSpan = document.getElementById('edit-display-name');
    const saveBtn = document.getElementById('save-name-btn');
    const newName = nameSpan.textContent.trim();

    if (!newName || newName === "Завантаження...") {
        alert("Будь ласка, введіть коректне ім'я");
        return;
    }

    saveBtn.textContent = "Зберігання...";
    saveBtn.disabled = true;

    try {
        const response = await fetch('update_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `new_name=${encodeURIComponent(newName)}`
        });

        const result = await response.json();

        if (result.success) {
            // Оновлюємо ім'я всюди на сторінці
            const nameHeader = document.getElementById('userName');
            if (nameHeader) nameHeader.textContent = newName;
            alert("Ім'я успішно змінено!");
        } else {
            alert("Помилка: " + result.message);
        }
    } catch (err) {
        console.error("Помилка при оновленні імені:", err);
        alert("Помилка сервера");
    } finally {
        saveBtn.textContent = "Змінити";
        saveBtn.disabled = false;
    }
}

// Прив'язуємо функцію до кнопки після завантаження сторінки
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-name-btn');
    if (saveBtn) {
        saveBtn.onclick = updateUserName;
    }

    const modal = document.getElementById('deco-modal');
    if (modal) {
        const items = modal.querySelectorAll('.deco-item');
        items.forEach(item => {
            const v = item.querySelector('video');
            item.onmouseenter = () => v.play();
            item.onmouseleave = () => {
                v.pause();
                v.currentTime = 0;
            };
        });
    }
});
// Запуск при повному завантаженні сторінки
window.addEventListener('load', loadUserData);

async function uploadBanner(file) {
    let formData = new FormData();
    formData.append('banner', file);
    try {
        const r = await fetch('upload_avatar.php', { method: 'POST', body: formData });
        const data = await r.json();
        if (data.success) loadUserData(); // Перезавантажуємо, щоб оновити картинки
    } catch (e) { console.error("Помилка завантаження банера:", e); }
}

async function saveBioToServer(text) {
    try {
        const res = await fetch('update_bio.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `bio=${encodeURIComponent(text)}`
        });
        const result = await res.json();
        if (result.success) {
            console.log("✅ Біо успішно збережено в БД");
            return true;
        }
        return false;
    } catch (err) {
        console.error("❌ Помилка збереження:", err);
        return false;
    }
}

// --- 3. ROBLOX AUTH & DATA FETCHING ---

function startRobloxAuth() {
    const authUrl = `https://apis.roblox.com/oauth/v1/authorize?` + 
                    `client_id=${clientId}&` +
                    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                    `scope=openid profile&` +
                    `response_type=code`;
    window.location.href = authUrl;
}

async function handleRobloxCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        // FIX: Call exchangeCodeForData, NOT checkAssetsOwnership directly
        await exchangeCodeForData(code);
    }
}

async function exchangeCodeForData(authCode) {
    try {
        const container = document.getElementById('selected-games-container');
        if (container) container.style.display = 'none';

        console.log("🔄 Відправляю код на свій PHP сервер...");

        // Звертаємося до НАШОГО сервера, а не до глючних проксі
        const response = await fetch('roblox_auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: authCode })
        });

        const result = await response.json();

        if (result.success) {
            console.log("✅ Дані від Roblox успішно отримано!");
            const userData = result.data;
            
            // Дістаємо ім'я та ID
            const robloxUsername = userData.preferred_username || userData.name || "RobloxPlayer";

            tempProfileData = { 
                name: robloxUsername,
                id: userData.sub, 
                stats: [] 
            };

            console.log("👤 Roblox User підключено:", tempProfileData.name);

            if (typeof closeEditor === 'function') closeEditor(); 
            
            // Зберігаємо в пам'ять
            localStorage.setItem('roblox_user', JSON.stringify(tempProfileData));

            // Запускаємо перевірку речей та ігор
            if (typeof checkAssetsOwnership === 'function') await checkAssetsOwnership(userData.sub);
            if (typeof openGamesModal === 'function') openGamesModal(); 
            
        } else {
            console.error("❌ Помилка сервера:", result.message, result.details);
            alert("Roblox відхилив авторизацію. Спробуйте ще раз.");
        }
    } catch (err) {
        console.error("❌ Критична помилка з'єднання:", err);
        alert("Не вдалося зв'язатися з нашим сервером.");
    }
}
// UNIVERSAL ASSET CHECKER (Badges + GamePasses)
// UNIVERSAL ASSET CHECKER (Оптимізована версія - без спаму запитами)
// UNIVERSAL ASSET CHECKER (Тепер працює через наш PHP сервер!)
async function checkAssetsOwnership(userId) {
    const loadingText = document.querySelector('.status-text');
    if (loadingText) loadingText.innerText = "⏳ Перевірка інвентаря Roblox...";

    console.log("🎒 Починаємо перевірку речей через наш сервер...");

    // Перевіряємо кожну гру
    for (let game of myGamesLibrary) {
        // Перевіряємо кожну річ
        for (let mode of game.modes) {
            mode.owned = false; // За замовчуванням речі немає
            
            try {
                const assetType = mode.type === 'pass' ? 'GamePass' : 'Badge';
                
                // Звертаємося до НАШОГО PHP-файлу замість сторонніх проксі
                const url = `roblox_auth.php?user_id=${userId}&type=${assetType}&id=${mode.id}`;
                const res = await fetch(url);
                
                if (res.ok) {
                    const data = await res.json();
                    // Якщо Roblox повернув масив data і він не порожній - річ є!
                    if (data && data.data && data.data.length > 0) {
                        mode.owned = true; 
                        console.log(`✅ Знайдено: ${mode.name}`);
                    }
                }
            } catch (e) {
                console.warn(`❌ Помилка перевірки ${mode.id}`);
            }
        }
    }

    console.log("✅ Всі перевірки інвентаря завершено!");
    if (loadingText) loadingText.innerText = "Підключено!";
}
// --- 4. MODAL LOGIC ---
// --- 5. ЛОГІКА ВИБОРУ (МОДАЛКА) ---
function openGamesModal() {
    const modal = document.getElementById('games-modal');
    if (modal) {
        loadMainLibrary();
        setTimeout(() => modal.classList.add('active'), 50);
        modal.style.display = 'flex';
    }
}

function closeGamesModal() {
    const modal = document.getElementById('games-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function loadMainLibrary() {
    const grid = document.getElementById('media-grid');
    const backBtn = document.getElementById('modal-back-button');
    const title = document.getElementById('modal-games-main-title');
    const footer = document.getElementById('modal-footer-actions');
    
    if (!grid) return;
    grid.innerHTML = '';
    
    if (backBtn) backBtn.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (title) title.innerText = "Виберіть гру";

    myGamesLibrary.forEach(game => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.onclick = () => openGameModes(game.name);
        card.innerHTML = `
            <div class="media-img-container"><img src="${game.img}"></div>
            <div class="media-title">${game.name}</div>
        `;
        grid.appendChild(card);
    });
}

function openGameModes(gameName) {
    const grid = document.getElementById('media-grid');
    const backBtn = document.getElementById('modal-back-button');
    const title = document.getElementById('modal-games-main-title');
    const footer = document.getElementById('modal-footer-actions');
    const game = myGamesLibrary.find(g => g.name === gameName);
    
    if (!game) return;

    grid.innerHTML = '';
    if (title) title.innerText = gameName;
    if (backBtn) backBtn.style.display = 'block';
    if (footer) footer.style.display = 'block';

    const availableModes = game.modes; // Показуємо всі (або фільтруй .filter(m => m.owned))

    availableModes.forEach(mode => {
        const card = document.createElement('div');
        card.className = 'media-card';
        
        // Перевіряємо, чи вже вибрано
        const isSelected = selectedItems.some(i => i.id === mode.id);
        if (isSelected) card.classList.add('selected');

        card.innerHTML = `
            <div class="media-img-container"><img src="${mode.img}"></div>
            <div class="media-title">${mode.name}</div>
        `;

        card.onclick = () => {
            card.classList.toggle('selected');
            
            if (card.classList.contains('selected')) {
                // Додаємо, якщо ще немає
                if (!selectedItems.some(i => i.id === mode.id)) {
                    selectedItems.push({ 
                        game: game.name, 
                        id: mode.id, 
                        name: mode.name, 
                        type: mode.type, 
                        img: mode.img 
                    });
                }
            } else {
                // Видаляємо
                selectedItems = selectedItems.filter(i => i.id !== mode.id);
            }
            console.log("Поточний вибір:", selectedItems);
        };
        grid.appendChild(card);
    });
}
function confirmSelection() {
    console.log("💾 Збереження...", selectedItems);

    if (!selectedItems || selectedItems.length === 0) {
        alert("Ви нічого не вибрали!");
        return;
    }

    const dataToSave = { stats: [...selectedItems] };
    localStorage.setItem('roblox_user', JSON.stringify(dataToSave));

    displayRobloxData(dataToSave);
    closeGamesModal();
}

function displayRobloxData(data) {
    const container = document.getElementById('roblox-games-render-zone');
    if (!container) return;

    container.innerHTML = '';

    // Стиль скролу
    const styleId = 'roblox-scroll-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .roblox-badges-scroll::-webkit-scrollbar { width: 3px; }
            .roblox-badges-scroll::-webkit-scrollbar-track { background: transparent; }
            .roblox-badges-scroll::-webkit-scrollbar-thumb { background: #555; border-radius: 2px; }
        `;
        document.head.appendChild(style);
    }

    if (!data || !data.stats || data.stats.length === 0) {
        container.innerHTML = '<span style="color: #666; font-style: italic;">Список ігор порожній...</span>';
        return;
    }

    const groups = {};
    data.stats.forEach(item => {
        if (!groups[item.game]) groups[item.game] = [];
        groups[item.game].push(item);
    });

    for (const gameName in groups) {
        const libraryGame = myGamesLibrary.find(g => g.name === gameName);
        const mainGameImg = libraryGame ? libraryGame.img : 'img/default_game.jpg';
        
        const badgesListHtml = groups[gameName].map(badge => `
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                padding: 4px 0; 
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-size: 11px;
                color: #ccc;
            ">
                <span style="display: flex; align-items: center; gap: 6px;">
                    <span style="width: 4px; height: 4px; background: #4CAF50; border-radius: 50%;"></span>
                    ${badge.name}
                </span>
                <span style="color: #4CAF50; font-size: 10px;">✔</span>
            </div>
        `).join('');

        const gameCard = document.createElement('div');
        
        gameCard.style.cssText = `
            background: #161616;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            width: 140px;
            height: 230px;
            overflow: hidden; 
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            margin-bottom: 10px;
            transition: transform 0.2s;
        `;

        gameCard.onmouseover = () => { gameCard.style.transform = "translateY(-3px)"; gameCard.style.borderColor = "#ff4500"; };
        gameCard.onmouseout = () => { gameCard.style.transform = "translateY(0)"; gameCard.style.borderColor = "rgba(255,255,255,0.1)"; };

       gameCard.innerHTML = `
            <div style="width: 100%; height: 130px; position: relative;">
                <img src="${mainGameImg}" 
                     style="width: 100%; height: 100%; 
                            object-fit: cover; 
                            object-position: top; /* Фіксуємо верх картинки */
                            display: block; 
                            border-radius: 12px 12px 0 0;" /* Закруглення тільки зверху */
                     onerror="this.src='https://via.placeholder.com/140x150?text=Game'">
                
                <div style="position: absolute; bottom: 0; width: 100%; height: 40px; background: linear-gradient(to top, #161616, transparent);"></div>
            </div>
            
            <div style="padding: 10px; padding-top: 5px;">
                <div style="font-weight: bold; font-size: 13px; color: white; margin-bottom: 5px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${gameName}
                </div>
                
                <div class="roblox-badges-scroll" style="height: 140px; overflow-y: auto;">
                    ${badgesListHtml}
                </div>
            </div>
        `;
        
        container.appendChild(gameCard);
    }
}                           
// --- АВТОЗБЕРЕЖЕННЯ ПІСЛЯ ПЕРЕЗАВАНТАЖЕННЯ (F5) ---                     
document.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('roblox_user');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Відновлюємо дані для модального вікна
        if (typeof tempProfileData !== 'undefined') tempProfileData = parsedData;
        if (typeof selectedItems !== 'undefined') selectedItems = parsedData.stats || [];
        
        // Малюємо ігри
        displayRobloxData(parsedData);
    }
});
// --- 6. UTILITIES ---
function closeEditor() { document.getElementById('editor-modal').style.display = 'none'; }

function switchEditorTab(tabName) {
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById('tab-' + tabName);
    if (target) target.classList.add('active');

    const btns = document.querySelectorAll('.sidebar-item');
    btns.forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });
}

function changeValue(type, delta) {
    const id = type === 'day' ? 'birth-day' : (type === 'month' ? 'birth-month' : 'birth-year');
    const input = document.getElementById(id);
    let val = parseInt(input.value);
    
    if (type === 'day') {
        val += delta;
        if (val < 1) val = 31;
        if (val > 31) val = 1;
    } else if (type === 'month') {
        val += delta;
        if (val < 1) val = 12;
        if (val > 12) val = 1;
    } else if (type === 'year') {
        val += delta;
        if (val < 1950) val = 2026;
        if (val > 2026) val = 1950;
    }
    
    // Добавляем нолик спереди для красоты (01, 02...)
    input.value = val < 10 && type !== 'year' ? '0' + val : val;
}

/* === ДАННЫЕ СТРАН === */
const countriesData = [
    { code: "UA", name: "Україна", flagPath: "img/flag/ua.png" },
    { code: "US", name: "США", flagPath: "img/flag/usa.png" },
    { code: "GB", name: "Велика Британія", flagPath: "img/flag/gb.webp" },
    { code: "PL", name: "Польща", flagPath: "img/flag/polish.webp" },
    { code: "DE", name: "Німеччина", flagPath: "img/flag/german.webp" },
    { code: "FR", name: "Франція", flagPath: "img/flag/fr.webp" },
    { code: "ES", name: "Іспанія", flagPath: "img/flag/ispan.png" },
    { code: "IT", name: "Італія", flagPath: "img/flag/itala.webp" },
    { code: "CA", name: "Канада", flagPath: "img/flag/kanada.webp" },
    { code: "JP", name: "Японія", flagPath: "img/flag/japen.png" },
    { code: "KR", name: "Південна Корея", flagPath: "img/flag/korea.png" },
    { code: "CN", name: "Китай", flagPath: "img/flag/kitai.png" },
    { code: "BR", name: "Бразилія", flagPath: "img/flag/brazil.png" },
    { code: "TR", name: "Туреччина", flagPath: "img/flag/tyrsia.jfif" },
    { code: "NL", name: "Нідерланди", flagPath: "img/flag/niderlandu.webp" },
    { code: "SE", name: "Швеція", flagPath: "img/flag/shesia.webp" },
    { code: "CH", name: "Швейцарія", flagPath: "img/flag/shversaria.jfif" },
    { code: "AU", name: "Австралія", flag: "🇦🇺" },
    { code: "AT", name: "Австрія", flag: "🇦🇹" },
    { code: "BE", name: "Бельгія", flag: "🇧🇪" },
    { code: "BG", name: "Болгарія", flag: "🇧🇬" },
    { code: "GR", name: "Греція", flag: "🇬🇷" },
    { code: "DK", name: "Данія", flag: "🇩🇰" },
    { code: "EE", name: "Естонія", flag: "🇪🇪" },
    { code: "IL", name: "Ізраїль", flag: "🇮🇱" },
    { code: "IE", name: "Ірландія", flag: "🇮🇪" },
    { code: "IS", name: "Ісландія", flag: "🇮🇸" },
    { code: "KZ", name: "Казахстан", flag: "🇰🇿" },
    { code: "LV", name: "Латвія", flag: "🇱🇻" },
    { code: "LT", name: "Литва", flag: "🇱🇹" },
    { code: "LU", name: "Люксембург", flag: "🇱🇺" },
    { code: "MX", name: "Мексика", flag: "🇲🇽" },
    { code: "NO", name: "Норвегія", flag: "🇳🇴" },
    { code: "AE", name: "ОАЕ", flag: "🇦🇪" },
    { code: "PT", name: "Португалія", flag: "🇵🇹" },
    { code: "RO", name: "Румунія", flag: "🇷🇴" },
    { code: "SK", name: "Словаччина", flag: "🇸🇰" },
    { code: "SI", name: "Словенія", flag: "🇸🇮" },
    { code: "HU", name: "Угорщина", flag: "🇭🇺" },
    { code: "FI", name: "Фінляндія", flag: "🇫🇮" },
    { code: "HR", name: "Хорватія", flag: "🇭🇷" },
    { code: "CZ", name: "Чехія", flag: "🇨🇿" },
    { code: "GE", name: "Грузія", flag: "🇬🇪" },
    { code: "AM", name: "Вірменія", flag: "🇦🇲" },
    { code: "AZ", name: "Азербайджан", flag: "🇦🇿" },
    { code: "MD", name: "Молдова", flag: "🇲🇩" },

    // --- ДОДАТКОВІ КРАЇНИ ---
    
    // Європа (інші)
    { code: "AL", name: "Албанія", flag: "🇦🇱" },
    { code: "AD", name: "Андорра", flag: "🇦🇩" },
    { code: "BA", name: "Боснія і Герцеговина", flag: "🇧🇦" },
    { code: "VA", name: "Ватикан", flag: "🇻🇦" },
    { code: "CY", name: "Кіпр", flag: "🇨🇾" },
    { code: "MT", name: "Мальта", flag: "🇲🇹" },
    { code: "MC", name: "Монако", flag: "🇲🇨" },
    { code: "ME", name: "Чорногорія", flag: "🇲🇪" },
    { code: "RS", name: "Сербія", flag: "🇷🇸" },
    { code: "MK", name: "Північна Македонія", flag: "🇲🇰" },

    // Азія
    { code: "IN", name: "Індія", flag: "🇮🇳" },
    { code: "ID", name: "Індонезія", flag: "🇮🇩" },
    { code: "TH", name: "Таїланд", flag: "🇹🇭" },
    { code: "VN", name: "В'єтнам", flag: "🇻🇳" },
    { code: "SG", name: "Сінгапур", flag: "🇸🇬" },
    { code: "MY", name: "Малайзія", flag: "🇲🇾" },
    { code: "PH", name: "Філіппіни", flag: "🇵🇭" },
    { code: "SA", name: "Саудівська Аравія", flag: "🇸🇦" },
    { code: "QA", name: "Катар", flag: "🇶🇦" },
    { code: "UZ", name: "Узбекистан", flag: "🇺🇿" },
    { code: "KG", name: "Киргизстан", flag: "🇰🇬" },

    // Америка (Південна та Центральна)
    { code: "AR", name: "Аргентина", flag: "🇦🇷" },
    { code: "CL", name: "Чилі", flag: "🇨🇱" },
    { code: "CO", name: "Колумбія", flag: "🇨🇴" },
    { code: "PE", name: "Перу", flag: "🇵🇪" },
    { code: "UY", name: "Уругвай", flag: "🇺🇾" },
    { code: "CR", name: "Коста-Рика", flag: "🇨🇷" },
    { code: "PA", name: "Панама", flag: "🇵🇦" },

    // Африка
    { code: "EG", name: "Єгипет", flag: "🇪🇬" },
    { code: "MA", name: "Марокко", flag: "🇲🇦" },
    { code: "ZA", name: "ПАР", flag: "🇿🇦" },
    { code: "NG", name: "Нігерія", flag: "🇳🇬" },
    { code: "TN", name: "Туніс", flag: "🇹🇳" },

    // Океанія
    { code: "NZ", name: "Нова Зеландія", flag: "🇳🇿" }
];
// Переменные для хранения выбора

function openCountryModal() {
    const modal = document.getElementById('region-modal'); // Или 'country-lang-modal', проверь ID в HTML
    if (modal) {
        modal.style.display = 'flex';
        renderLists(); // Рендерим списки при открытии
    }
}
function closeCountryModal() {
    const modal = document.getElementById('region-modal'); 
    if (modal) {
        modal.style.display = 'none';
    }
}

function renderLists() {
    const langContainer = document.getElementById('language-list-container');
    const countryContainer = document.getElementById('country-list-container');
    const searchInput = document.getElementById('country-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    // Очистка
    if (langContainer) langContainer.innerHTML = '';
    if (countryContainer) countryContainer.innerHTML = '';

    if (!countriesData) return;

    countriesData.forEach(item => {
        // Фильтрация по поиску
        if (item.name.toLowerCase().includes(searchTerm)) {
            
            // Логика картинки или эмодзи
            const flagHtml = item.flagPath 
                ? `<img src="${item.flagPath}" class="flag-img" alt="${item.name}" style="width:20px; margin-right:8px;">` 
                : `<span class="flag-emoji" style="font-size:20px; margin-right:8px;">${item.flag}</span>`;
            
            const itemContent = `${flagHtml}<span class="country-name">${item.name}</span>`;

            // 1. ЛЕВАЯ КОЛОНКА (Языки)
            if (langContainer) {
                const langItem = document.createElement('div');
                // Добавляем класс 'lang-item' чтобы можно было стилизовать отдельно
                langItem.className = `lang-item list-item ${selectedLanguages.includes(item.code) ? 'selected' : ''}`;
                langItem.dataset.code = item.code;
                langItem.innerHTML = itemContent;
                langItem.onclick = () => toggleLanguage(item.code);
                langContainer.appendChild(langItem);
            }

            // 2. ПРАВАЯ КОЛОНКА (Страна)
            if (countryContainer) {
                const countryItem = document.createElement('div');
                // ВАЖНО: Добавляем класс 'country-item'
                countryItem.className = `country-item list-item ${selectedCountry === item.code ? 'selected' : ''}`;
                countryItem.dataset.code = item.code;
                countryItem.innerHTML = itemContent;
                countryItem.onclick = () => selectCountry(item.code);
                countryContainer.appendChild(countryItem);
            }
        }
    });
}

// Логика выбора ОДНОЙ страны (радио-кнопка)
function selectCountry(code) {
    selectedCountry = code; // Записываем в глобальную переменную
    console.log("Выбрана страна:", selectedCountry);
    renderLists(); // Перерисовываем, чтобы появилась подсветка
}
// Логика выбора НЕСКОЛЬКИХ языков (чекбокс)
function toggleLanguage(code) {
    if (selectedLanguages.includes(code)) {
        selectedLanguages = selectedLanguages.filter(lang => lang !== code);
    } else {
        if (selectedLanguages.length >= 4) {
            alert("Можна обрати не більше 4 мов");
            return;
        }
        selectedLanguages.push(code);
    }
    renderLists();
}

// Функция поиска
function filterCountries() {
    renderLists();
}

// Ця функція викликається, коли ви тиснете "Зберегти зміни" в модальному вікні
async function saveRegionSettings() {
    // ИСПРАВЛЕНИЕ: Проверяем глобальную переменную, а не ищем в HTML
    if (!selectedCountry) {
        alert("Будь ласка, оберіть країну проживання");
        return;
    }

    const payload = {
        country: selectedCountry,       // Берем из переменной: "UA"
        languages: selectedLanguages.join(',') // Берем из переменной: "UA,EN"
    };

    console.log("💾 Отправка на сервер:", payload);

    try {
        const response = await fetch('save_region.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            // Обновляем профиль сразу
            if (typeof renderUserFlags === 'function') {
                renderUserFlags(payload.country, payload.languages);
            }
            
            closeCountryModal(); 
            // alert("Збережено успішно!"); // Можно раскомментировать для проверки
        } else {
            alert("Помилка сервера: " + (result.message || "Невідома помилка"));
        }
    } catch (err) {
        console.error("❌ Помилка збереження:", err);
        alert("Помилка з'єднання");
    }
}
for (let i = 0; i < 24; i++) {
    const cell = document.createElement('div');
    cell.classList.add('hour-cell');
    cell.innerText = i;
    cell.dataset.hour = i;

    // Клик по ячейке
    cell.onclick = () => {
        const currentHour = parseInt(cell.dataset.hour);

        if (firstClick === null) {
            // ПЕРВЫЙ КЛИК: устанавливаем точку старта
            firstClick = currentHour;
            resetGridClasses();
            cell.classList.add('selected');
        } else {
            // ВТОРОЙ КЛИК: фиксируем интервал
            startHour = Math.min(firstClick, currentHour);
            endHour = Math.max(firstClick, currentHour);

            renderSelection(startHour, endHour);
            saveTime(); 
            
            firstClick = null; // Выключаем режим слежения
        }
    };

    // НАВЕДЕНИЕ МЫШКИ: живое обновление полосы
    cell.onmouseenter = () => {
        if (firstClick !== null) {
            // Если первая точка выбрана, подсвечиваем путь до текущей ячейки
            const currentHour = parseInt(cell.dataset.hour);
            const tempMin = Math.min(firstClick, currentHour);
            const tempMax = Math.max(firstClick, currentHour);
            
            renderSelection(tempMin, tempMax);
        }
    };

    grid.appendChild(cell);
}
window.onmouseup = () => {
    if (isDragging) {
        isDragging = false;
        saveTime();
    }
};

function renderSelection(min, max) {
    const cells = document.querySelectorAll('.hour-cell');
    cells.forEach(cell => {
        const h = parseInt(cell.dataset.hour);
        if (h >= min && h <= max) {
            cell.classList.add('selected');
        } else {
            cell.classList.remove('selected');
        }
    });
}

function resetGridClasses() {
    const cells = document.querySelectorAll('.hour-cell');
    cells.forEach(cell => cell.classList.remove('selected'));
}
function updateSelection(current) {
    const cells = document.querySelectorAll('.hour-cell');
    let min = Math.min(startHour, current);
    let max = Math.max(startHour, current);
    
    cells.forEach(cell => {
        const h = parseInt(cell.dataset.hour);
        cell.classList.toggle('selected', h >= min && h <= max);
    });
    endHour = max;
    startHour = min;
}

async function saveTime() {
    // Перевіряємо, чи змінні існують (вони у вас глобальні)
    if (startHour !== null && endHour !== null) {
        
        // 1. ВІЗУАЛЬНЕ ОНОВЛЕННЯ (Те, що у вас вже було)
        const textDisplay = document.getElementById('activityText');
        const trigger = document.getElementById('activityTrigger');
        
        if (textDisplay) textDisplay.innerText = `${startHour}:00 — ${endHour}:00`;
        if (trigger) trigger.classList.add('is-set');
        
        checkStatus(); // Оновлюємо іконку (💤 або 🎮)

        // 2. ВІДПРАВКА НА СЕРВЕР (Цього не вистачало!)
        console.log("💾 Зберігаю час активності:", startHour, endHour);

        try {
            const response = await fetch('update_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    start: startHour, 
                    end: endHour 
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log("✅ Час успішно записано в БД!");
            } else {
                console.error("Помилка сервера:", result.message);
            }
        } catch (err) {
            console.error("Помилка з'єднання:", err);
        }
    }
}

function checkStatus() {
    // Если время не выбрано (startHour еще null)
    if (startHour === null || endHour === null) {
        trigger.classList.add('inactive-now');
        trigger.classList.remove('active-now');
        iconDisplay.innerHTML = '🕒'; 
        return;
    }
    
    const now = new Date().getHours();
    const isActive = (startHour <= endHour) 
        ? (now >= startHour && now <= endHour)
        : (now >= startHour || now <= endHour);

    if (isActive) {
        trigger.classList.add('active-now');
        trigger.classList.remove('inactive-now');
        iconDisplay.innerHTML = '🎮';
    } else {
        trigger.classList.add('inactive-now');
        trigger.classList.remove('active-now');
        iconDisplay.innerHTML = '💤';
    }
}

// Открытие/закрытие панели
trigger.onclick = () => picker.style.display = 'block';
document.getElementById('closePicker').onclick = (e) => {
    e.stopPropagation();
    picker.style.display = 'none';
};

// Обновляем статус каждую минуту
setInterval(checkStatus, 60000);


// Функція для отримання імені з Бази Даних (PHP)

async function updateNameInDB() {
    const nameInput = document.getElementById('edit-display-name');
    const newName = nameInput.value.trim();
    const btn = document.querySelector('.inline-btn');

    if (!newName) return alert("Ім'я не може бути порожнім!");

    btn.textContent = "Зберігання..."; // Визуальный эффект загрузки
    
    try {
        const response = await fetch('update_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `new_name=${encodeURIComponent(newName)}`
        });

        const result = await response.json();

        if (result.success) {
            // Если в базе сохранилось, обновляем текст в шапке профиля сразу
            const nameBlock = document.getElementById('userName');
            if (nameBlock) nameBlock.textContent = newName;
            
            alert("Ім'я успішно змінено в базі!");
        } else {
            alert("Помилка: " + result.message);
        }
    } catch (err) {
        alert("Помилка сервера при оновленні");
    } finally {
        btn.textContent = "Змінити";
    }
}

function initTimeGrid() {
    const grid = document.getElementById('time-grid'); // Переконайся, що ID вірний
    if (!grid) return;

    // ОЧИЩЕННЯ: видаляємо старі комірки перед створенням нових
    grid.innerHTML = ''; 

    for (let i = 0; i < 24; i++) {
        const cell = document.createElement('div');
        cell.classList.add('hour-cell');
        cell.innerText = i;
        cell.dataset.hour = i;

        // Клик по ячейке
        cell.onclick = () => {
            const currentHour = parseInt(cell.dataset.hour);

            if (firstClick === null) {
                firstClick = currentHour;
                resetGridClasses();
                cell.classList.add('selected');
            } else {
                startHour = Math.min(firstClick, currentHour);
                endHour = Math.max(firstClick, currentHour);
                renderSelection(startHour, endHour);
                saveTime(); 
                firstClick = null;
            }
        };

        // Наведение мышки (живое обновление)
        cell.onmouseenter = () => {
            if (firstClick !== null) {
                const currentHour = parseInt(cell.dataset.hour);
                const tempMin = Math.min(firstClick, currentHour);
                const tempMax = Math.max(firstClick, currentHour);
                renderSelection(tempMin, tempMax);
            }
        };

        grid.appendChild(cell);
    }
}

// --- 3. ІНІЦІАЛІЗАЦІЯ ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Скрипт ініціалізовано!");

    // 1. Завантаження збережених ігор (ОСНОВНЕ)
    const savedData = localStorage.getItem('roblox_user');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            // Відновлюємо глобальну змінну, щоб модалка знала, що вже вибрано
            if (parsedData.stats) {
                selectedItems = parsedData.stats;
                displayRobloxData(parsedData); // МАЛЮЄМО ВІДРАЗУ
            }
        } catch (e) {
            console.error("Помилка читання localStorage:", e);
        }
    }

    // 2. Інші завантаження
    loadUserData();
    
    // 3. Обробка модалки декору
    const openBtn = document.getElementById('open-deco-modal-btn');
    if (openBtn) {
        openBtn.onclick = (e) => {
            e.preventDefault();
            window.toggleDecoModal(true);
        };
    }

    // 4. Обробка Roblox Callback
    handleRobloxCallback();
});

// ==========================================
// ФУНКЦІЯ ОНОВЛЕННЯ ІМЕНІ (User / Display Name)
// ==========================================
async function updateDisplayName() {
    const nameInput = document.getElementById('edit-display-name');
    const changeBtn = document.querySelector('.inline-btn'); // Кнопка "Змінити"

    if (!nameInput || !changeBtn) return;

    // Беремо текст. Якщо це input - value, якщо span - innerText
    const newName = nameInput.value ? nameInput.value.trim() : nameInput.innerText.trim();

    if (!newName) {
        alert("Будь ласка, введіть ім'я");
        return;
    }

    // Візуальний ефект завантаження
    const originalBtnText = changeBtn.textContent;
    changeBtn.textContent = "Збереження...";
    changeBtn.disabled = true;

    try {
        // ВАЖЛИВО: Відправляємо на update_user.php
        // Цей файл оновлює колонку `user` у базі даних
        const response = await fetch('update_user.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `new_name=${encodeURIComponent(newName)}`
        });

        const result = await response.json();

        if (result.success) {
            // 1. Оновлюємо шапку профілю відразу
            const topNameBlock = document.getElementById('userName');
            if (topNameBlock) topNameBlock.textContent = newName;
            
            // 2. Оновлюємо саме поле вводу (щоб прибрати зайві пробіли)
            if (nameInput.value) nameInput.value = newName;
            else nameInput.innerText = newName;

            alert("Ім'я успішно збережено!");
        } else {
            alert("Помилка сервера: " + result.message);
        }
    } catch (error) {
        console.error("Помилка запиту:", error);
        alert("Помилка з'єднання з сервером");
    } finally {
        // Повертаємо кнопку назад
        changeBtn.textContent = originalBtnText;
        changeBtn.disabled = false;
    }
}

// ==========================================
// СЛУХАЧ ПОДІЙ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const changeBtn = document.querySelector('.inline-btn');
    if (changeBtn) {
        // Видаляємо старі слухачі (cloneNode трюк), щоб кнопка не натискалася двічі
        const newBtn = changeBtn.cloneNode(true);
        changeBtn.parentNode.replaceChild(newBtn, changeBtn);
        
        // Призначаємо нашу функцію
        newBtn.onclick = updateDisplayName;
    }
});
function openSettings() {
    const modal = document.getElementById('editor-modal'); // Твій правильний ID
    if (modal) {
        modal.style.display = 'flex';
    } else {
        console.error("Помилка: Вікно 'editor-modal' не знайдено!");
    }
}

function closeEditor() {
    const modal = document.getElementById('editor-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Додайте також функцію для перемикання вкладок, щоб вони працювали
function switchEditorTab(tabName) {
    // Ховаємо всі вкладки
    const tabs = document.querySelectorAll('.editor-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Прибираємо активний клас у кнопок
    const buttons = document.querySelectorAll('.sidebar-item');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Показуємо потрібну вкладку
    const activeTab = document.getElementById('tab-' + tabName);
    if (activeTab) activeTab.classList.add('active');
    
    // Робимо кнопку активною (через event або пошук тексту)
    event.currentTarget.classList.add('active');
}
function uploadAvatar(file) {
    if (!file) return;

    let formData = new FormData();
    formData.append('avatar', file);

    fetch('upload_avatar.php', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // Як тільки фото завантажилось — перемальовуємо все заново
            loadUserData();
        } else {
            alert("Помилка: " + data.error);
        }
    })
    .catch(err => console.error("Помилка завантаження:", err));
}


function uploadBanner(file) {
    if (!file) return;

    let formData = new FormData();
    formData.append('banner', file);

    fetch('upload_avatar.php', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // [ВИПРАВЛЕНО] Додаємо слеш на початку, якщо його немає
            let cleanUrl = data.url;
            if (!cleanUrl.startsWith('/')) {
                cleanUrl = '/' + cleanUrl;
            }
            // Додаємо timestamp, щоб оновити кеш
            const finalUrl = cleanUrl + '?t=' + Date.now();

            // Оновлюємо банер в налаштуваннях
            const settingsBanner = document.getElementById('settings-banner-img');
            if (settingsBanner) settingsBanner.src = finalUrl;

            // Оновлюємо банер в картці
            const lightCard = document.querySelector('.light-card');
            if (lightCard) {
                lightCard.style.backgroundImage = `url('${finalUrl}')`;
                lightCard.style.backgroundSize = 'cover';
                lightCard.style.backgroundPosition = 'center'; // Центруємо, щоб виглядало гарно
            }
        }
    })
    .catch(err => console.error("Помилка:", err));
}

// Функція завантаження банера (Async/Await версія)
async function directUpload(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const statusText = document.getElementById('upload-status-text');
    if (statusText) statusText.innerText = "⏳ Завантаження...";
    
    console.log("📤 Відправка файлу:", file.name);

    const formData = new FormData();
    formData.append('banner', file);

    try {
        const response = await fetch('upload_avatar.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log("📥 Відповідь сервера (RAW):", data);

        if (data.success) {
            if (statusText) statusText.innerText = "✅ Готово!";
            
            // 1. Формуємо правильний URL
            // Якщо сервер повернув "uploads/banners/img.jpg", ми робимо "/uploads/banners/img.jpg"
            let finalUrl = data.url;
            if (!finalUrl.startsWith('/')) {
                finalUrl = '/' + finalUrl;
            }
            
            // Додаємо timestamp проти кешу
            finalUrl += '?t=' + Date.now();

            console.log("🔗 Спроба завантажити картинку за адресою:", finalUrl);

            // 2. Ставимо картинку
            const profileCard = document.querySelector('.light-card');
            if (profileCard) {
                profileCard.style.backgroundImage = `url('${finalUrl}')`;
            }
            
            const settingsBanner = document.getElementById('settings-banner-img');
            if (settingsBanner) {
                settingsBanner.src = finalUrl;
            }

        } else {
            alert("Помилка: " + (data.error || "Невідома помилка"));
            if (statusText) statusText.innerText = "❌ Помилка";
        }
    } catch (err) {
        console.error("❌ Критична помилка:", err);
        alert("Помилка з'єднання.");
    }
}

async function uploadBackground(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const formData = new FormData();
    // ВАЖЛИВО: ключ має бути 'background', бо PHP шукає саме його
    formData.append('background', file); 

    try {
        const response = await fetch('upload_avatar.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            loadUserData(); // Перезавантажуємо дані, щоб фон оновився
            alert("Фон успішно оновлено!");
        } else {
            alert("Помилка: " + data.error);
        }
    } catch (err) {
        console.error("Помилка:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Безпечний пошук секції "ПРИКРАСА АВАТАРА" (без помилки :has)
    let decoSection = null;
    document.querySelectorAll('.setting-item').forEach(item => {
        if (item.textContent.includes('ПРИКРАСА АВАТАРА')) {
            decoSection = item;
        }
    });
    
    // Якщо не знайшли по тексту, беремо за індексом, як було у вас
    if (!decoSection) decoSection = document.querySelectorAll('.setting-item')[2];

    const selectDecoBtn = decoSection ? decoSection.querySelector('.inline-btn') : null;
    const removeDecoBtn = decoSection ? decoSection.querySelector('.btn-danger-outline') : null;
    const decoModal = document.getElementById('deco-modal');

    // Відкриття модалки прикрас
    if (selectDecoBtn) {
        selectDecoBtn.onclick = (e) => {
            e.preventDefault();
            if (decoModal) decoModal.style.display = 'flex';
        };
    }

    // Прибрати прикрасу (ВИПРАВЛЕНО: видаляє і зі сторінки)
    if (removeDecoBtn) {
        removeDecoBtn.onclick = (e) => {
            e.preventDefault();
            
            // 1. Очищаємо кнопку
            if(selectDecoBtn) selectDecoBtn.innerHTML = 'Обрати прикрасу';
            
            // 2. Очищаємо велике відео на сторінці
            const square = document.querySelector('.transparent-square');
            if (square) square.innerHTML = '';
            
            // 3. Видаляємо з пам'яті
            localStorage.removeItem('user_decoration'); // Переконайся, що ключ збігається з іншими функціями
            localStorage.removeItem('user_deco');
            
            console.log("✅ Прикрасу видалено");
        };
    }

    // Керування відео в модалці (грати при наведенні)
    document.querySelectorAll('.deco-item').forEach(item => {
        const v = item.querySelector('video');
        if (v) {
            item.onmouseenter = () => v.play().catch(() => {}); // catch запобігає помилкам автоплею
            item.onmouseleave = () => { v.pause(); v.currentTime = 0; };
        }
    });

    // Закриття модалки при кліку на фон
    window.onclick = (event) => {
        if (event.target === decoModal) {
            if (typeof toggleDecoModal === "function") {
                toggleDecoModal(false);
            } else if (decoModal) {
                decoModal.style.display = 'none';
            }
        }
    };

    // Перевірка збереженої прикраси
    const saved = localStorage.getItem('user_decoration') || localStorage.getItem('user_deco');
    if (saved && typeof applyDecoration === "function") {
        applyDecoration(saved);
    }
});

// Додаємо обробник для кнопки видалення в DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const removeBtn = document.querySelector('.btn-danger-outline') || document.querySelector('button[style*="color: red"]');
    if (removeBtn) {
        removeBtn.onclick = (e) => {
            e.preventDefault();
            window.removeDecoration();
        };
    }
    
    // Автозавантаження при старті
    const saved = localStorage.getItem('user_decoration');
    if (saved) window.applyDecoration(saved);
});

// Функція для збереження додаткового email
function saveSecondaryEmail() {
    const emailInput = document.getElementById('edit-secondary-email');
    const newEmail = emailInput.innerText.trim();

    if (newEmail && !validateEmail(newEmail)) {
        alert("Будь ласка, введіть коректний email.");
        return;
    }

    // Зберігаємо в локальне сховище (поки немає сервера)
    localStorage.setItem('user_secondary_email', newEmail);
    
    alert("Додатковий email збережено!");
}

// Допоміжна функція валідації
function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

// Додай це всередину функції loadUserData, щоб email підтягувався при вході
function loadSecondaryEmail() {
    const savedEmail = localStorage.getItem('user_secondary_email');
    const emailInput = document.getElementById('edit-secondary-email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }
}

// Виклич loadSecondaryEmail() при завантаженні сторінки
document.addEventListener('DOMContentLoaded', loadSecondaryEmail);

function displayUserFlags(countryCode, languagesIconsString) {
    const flagsContainer = document.getElementById('userFlags');
    if (!flagsContainer) return;

    flagsContainer.innerHTML = ''; // Очищуємо перед заповненням

    // 1. Додаємо прапор країни проживання
    if (countryCode) {
        // Шукаємо шлях до фото в твоєму масиві countriesData
        const country = countriesData.find(c => c.code === countryCode);
        if (country && country.flagPath) {
            const img = document.createElement('img');
            img.src = country.flagPath;
            img.title = "Країна: " + country.name;
            flagsContainer.appendChild(img);
        }
    }

    // 2. Додаємо розділювач, якщо є і країна, і мови
    if (countryCode && languagesIconsString) {
        const separator = document.createElement('span');
        separator.innerText = '/';
        separator.style.color = 'gray';
        separator.style.margin = '0 4px';
        flagsContainer.appendChild(separator);
    }

    // 3. Додаємо іконки мов (розбиваємо рядок з БД назад у масив)
    if (languagesIconsString) {
        const icons = languagesIconsString.split(',');
        icons.forEach(path => {
            if (path) {
                const img = document.createElement('img');
                img.src = path;
                flagsContainer.appendChild(img);
            }
        });
    }
}

function renderUserFlags(countryCode, langsString) {
    const container = document.getElementById('userFlags');
    if (!container) return;

    container.innerHTML = ''; // Очищуємо попередні прапорці

    // 1. Обробка КРАЇНИ проживання
    if (countryCode) {
        // Шукаємо країну в наявному масиві за кодом
        const country = countriesData.find(c => c.code === countryCode.trim().toUpperCase());
        if (country) {
            container.appendChild(createFlagElement(country));
        }
    }

    // Розділювач "/"
    if (countryCode && langsString) {
        const sep = document.createElement('span');
        sep.innerText = '/';
        sep.style.margin = "0 8px";
        sep.style.opacity = "0.5";
        container.appendChild(sep);
    }

    // 2. Обробка МОВ спілкування
    if (langsString) {
        const codes = langsString.split(',');
        codes.forEach(code => {
            const cleanCode = code.trim().toUpperCase();
            const lang = countriesData.find(c => c.code === cleanCode);
            if (lang) {
                container.appendChild(createFlagElement(lang));
            }
        });
    }
}

// Допоміжна функція для створення або IMG або SPAN (для емодзі)
function createFlagElement(data) {
    if (data.flagPath) {
        // Якщо в масиві є шлях до локального файлу
        const img = document.createElement('img');
        img.src = data.flagPath;
        img.alt = data.name;
        img.title = data.name;
        img.style.width = "24px";
        img.style.height = "auto";
        img.style.marginLeft = "4px";
        return img;
    } else {
        // Якщо є тільки емодзі (для додаткових країн)
        const span = document.createElement('span');
        span.innerText = data.flag;
        span.title = data.name;
        span.style.fontSize = "20px";
        span.style.marginLeft = "4px";
        return span;
    }
}

function updateGradientPreview() {
    const leftInput = document.getElementById('color-left');
    const rightInput = document.getElementById('color-right');
    const previewBox = document.getElementById('gradient-preview-box');

    if (leftInput && rightInput && previewBox) {
        const colorL = leftInput.value;
        const colorR = rightInput.value;

        // Оновлюємо прямокутник прев'ю
        previewBox.style.background = `linear-gradient(135deg, ${colorL}, ${colorR})`;

        // Оновлюємо колір самих кружечків (піпеток)
        if (leftInput.parentElement) leftInput.parentElement.style.backgroundColor = colorL;
        if (rightInput.parentElement) rightInput.parentElement.style.backgroundColor = colorR;
    }
}

// 2. Функція збереження градієнта в БД
async function applyGradientToBlock() {
    const colorL = document.getElementById('color-left').value;
    const colorR = document.getElementById('color-right').value;
    const btn = document.querySelector('.confirm-btn');

    // Анімація кнопки
    const originalText = btn.innerText;
    btn.innerText = "Збереження...";
    btn.disabled = true;

    try {
        const response = await fetch('update_gradient.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color_left: colorL, color_right: colorR })
        });

        const result = await response.json();

        if (result.success) {
            // Оновлюємо реальний фон на сайті
            const mainBlock = document.querySelector('.black-block.main-gradient-bg');
            if (mainBlock) {
                mainBlock.style.background = `linear-gradient(135deg, ${colorL}, ${colorR})`;
            }
            alert("✅ Градієнт успішно збережено!");
        } else {
            alert("❌ Помилка: " + result.message);
        }
    } catch (error) {
        console.error("Помилка:", error);
        alert("Помилка з'єднання з сервером.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// ГЛОБАЛЬНІ ЗМІННІ (Вставте це на початку файлу)
// ==========================================
const badgeImages = {
    'vip': 'img/badge 1.png',
    'admin': 'img/badge 2.png',
    'verified': 'img/badge 3.png',
    'bug_hunter': 'img/badge 4.png',
    'creative': 'img/badge 5.png'
};

// Клік по бейджу (вибір/скасування)
function toggleBadge(element) {
    // 1. Перевіряємо, чи цей бейдж вже вибраний зараз
    // (Браузери можуть зберігати колір як rgb(255, 69, 0) або hex #ff4500, тому перевіряємо обидва варіанти)
    const isSelected = (element.style.borderColor === 'rgb(255, 69, 0)' || element.style.borderColor === '#ff4500');

    if (isSelected) {
        // === ЯКЩО ВЖЕ ВИБРАНИЙ -> ЗНІМАЄМО ВИДІЛЕННЯ ===
        // Знімати виділення можна завжди, ліміт тут не важливий
        element.style.borderColor = '#444';
        element.style.background = '#222';
    } else {
        // === ЯКЩО ХОЧЕМО ВИБРАТИ НОВИЙ -> ПЕРЕВІРЯЄМО ЛІМІТ ===
        
        // а) Рахуємо, скільки бейджів вже світяться помаранчевим
        let count = 0;
        const allBadges = document.querySelectorAll('.badge-item');
        allBadges.forEach(badge => {
            if (badge.style.borderColor === 'rgb(255, 69, 0)' || badge.style.borderColor === '#ff4500') {
                count++;
            }
        });

        // б) Якщо вже вибрано 5 (або більше) -> забороняємо і показуємо попередження
        if (count >= 5) {
            alert("Максимум можна обрати 5 бейджів!");
            return; // Зупиняємо функцію, нічого не змінюємо
        }

        // в) Якщо ліміт не перевищено -> виділяємо
        element.style.borderColor = '#ff4500';
        element.style.background = '#331a15';
    }
}

function openBadgesModal() {
    document.getElementById('badges-modal').style.display = 'flex';
}

function closeBadgesModal() {
    document.getElementById('badges-modal').style.display = 'none';
}

// 3. Вибір бейджа (Клік по картинці)
function toggleBadge(element) {
    // Перевіряємо, чи вибраний елемент (за кольором рамки)
    const isSelected = (element.style.borderColor === 'rgb(255, 69, 0)' || element.style.borderColor === '#ff4500');

    if (isSelected) {
        // Якщо вже вибраний -> знімаємо виділення
        element.style.borderColor = '#444';
        element.style.background = '#222';
    } else {
        // Якщо хочемо вибрати -> перевіряємо ліміт (макс 5)
        let count = 0;
        document.querySelectorAll('.badge-item').forEach(item => {
            if (item.style.borderColor === 'rgb(255, 69, 0)' || item.style.borderColor === '#ff4500') {
                count++;
            }
        });

        if (count >= 5) {
            alert("Максимум можна обрати 5 бейджів!");
            return;
        }

        // Виділяємо
        element.style.borderColor = '#ff4500';
        element.style.background = '#331a15';
    }
}

async function saveBadgesSelection() {
    console.log("💾 Починаємо збереження бейджів...");

    const badgeItems = document.querySelectorAll('.badge-item');
    let selectedBadges = [];

    // Збираємо вибрані бейджі
    badgeItems.forEach(item => {
        // Перевіряємо обидва варіанти кольору (HEX і RGB)
        if (item.style.borderColor === 'rgb(255, 69, 0)' || item.style.borderColor === '#ff4500') {
            selectedBadges.push(item.getAttribute('data-badge'));
        }
    });

    console.log("Масив для відправки:", selectedBadges);

    // 1. Спочатку оновлюємо вигляд на сторінці (щоб було миттєво)
    renderBadgesOnProfile(selectedBadges);
    closeBadgesModal();

    // 2. Відправляємо на сервер
    try {
        const response = await fetch('save_badges.php', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' // <--- ЦЕ ДУЖЕ ВАЖЛИВО!
            },
            body: JSON.stringify({ badges: selectedBadges })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log("✅ Успішно збережено в базі:", result.saved);
        } else {
            console.error("❌ Помилка сервера:", result.message);
            alert("Помилка збереження: " + result.message);
        }
    } catch (err) {
        console.error("❌ Помилка мережі:", err);
    }
}

// 5. Функція відображення бейджів у профілі
function renderBadgesOnProfile(badgesArray) {
    const displayArea = document.getElementById('badges-display-area');
    if (!displayArea) return;

    // Очищення, якщо нічого не вибрано
    if (!badgesArray || badgesArray.length === 0 || (badgesArray.length === 1 && badgesArray[0] === "")) {
        displayArea.innerHTML = '<span style="font-size: 12px; color: #444;">Немає бейджів</span>';
        displayArea.classList.remove('has-items');
        return;
    }

    let html = '';
    badgesArray.forEach(badgeName => {
        // Беремо шлях до картинки з нашого об'єкта badgeImages
        const imagePath = badgeImages[badgeName];
        
        if (imagePath) {
            html += `<img src="${imagePath}" alt="${badgeName}" title="${badgeName}">`;
        }
    });

    displayArea.innerHTML = html;
    displayArea.classList.add('has-items');
}

// --- ФУНКЦІЇ БЛОГУ ---

function openBlogModal() {
    document.getElementById('blog-modal-overlay').style.display = 'flex';
}

function closeBlogModal() {
    document.getElementById('blog-modal-overlay').style.display = 'none';
}

// Функція для відправки повідомлення (візуально)
function sendBlogMessage() {
    const input = document.getElementById('blog-input');
    const text = input.value.trim();
    
    if (text) {
        const chatArea = document.getElementById('chat-messages-area');
        
        // Створюємо нову бульку повідомлення
        const newMsg = document.createElement('div');
        newMsg.classList.add('message-bubble');
        // Робимо його "своїм" (справа), якщо це коментар
        newMsg.style.alignSelf = 'flex-end'; 
        newMsg.style.background = '#2b5278'; // Інший колір для своїх повідомлень
        
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        newMsg.innerHTML = `${text} <div class="message-date">${time}</div>`;
        
        chatArea.appendChild(newMsg);
        
        // Прокрутка вниз
        chatArea.scrollTop = chatArea.scrollHeight;
        
        input.value = ''; // Очистити поле
    }
}
function updateProfileGifts() {
    const giftArea = document.getElementById('gifts-display-area');
    if (!giftArea) return;

    // Читаємо з того ж ключа 'my_shared_gifts'
    const gifts = JSON.parse(localStorage.getItem('my_shared_gifts')) || [];

    if (gifts.length > 0) {
        giftArea.innerHTML = ''; // Прибираємо "Подарунків немає"
        
        gifts.forEach(gift => {
            const img = document.createElement('img');
            img.src = gift.src;
            img.title = gift.name;
            img.style.width = '35px';
            img.style.height = '35px';
            img.style.margin = '5px';
            img.style.borderRadius = '5px';
            giftArea.appendChild(img);
        });
    }
}

onAuthStateChanged(auth, (user) => {
    const statusDot = document.getElementById('status-dot');
    
    if (user) {
        console.log("Користувач онлайн");
        if (statusDot) {
            statusDot.classList.remove('status-offline');
            statusDot.classList.add('status-online');
        }
        // ... твій інший код оновлення імені ...
    } else {
        console.log("Користувач офлайн");
        if (statusDot) {
            statusDot.classList.remove('status-online');
            statusDot.classList.add('status-offline');
        }
        // window.location.replace("index.html");
    }
});