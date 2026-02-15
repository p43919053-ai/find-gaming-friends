const postBackups = {}; 
let currentTargetBox = null;
window.currentActiveSquare = null;
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
if (!window.commentsData) { window.commentsData = {}; }
let currentActiveTarget = null;
let currentActiveSquare = null;
let app, auth, db;

// ==========================================
// 1. АВТОРИЗАЦІЯ FIREBASE (Виправлено порядок)
// ==========================================
// ==========================================
// 1. АВТОРИЗАЦІЯ FIREBASE (Виправлена конфігурація)
// ==========================================
(async function initAuth() {
    try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
        const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        // ТВОЯ НОВА КОНФІГУРАЦІЯ (має бути така ж, як в index.html)
        const firebaseConfig = {
            apiKey: "AIzaSyAnc1n52-LVhZ72vYSmvWv97enqqrqBBi4",
            authDomain: "mneploho-7ff8b.firebaseapp.com",
            projectId: "mneploho-7ff8b",
            storageBucket: "mneploho-7ff8b.firebasestorage.app",
            messagingSenderId: "554377149418",
            appId: "1:554377149418:web:44f345329d803c674c9093",
            measurementId: "G-LM2032YE2W"
        };

        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        window.db = db;

        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("Вхід виконано:", user.email);
                const nickLabel = document.querySelector('.user-nick');
                const savedName = localStorage.getItem('user_name');
                if (nickLabel) {
                    nickLabel.innerText = savedName || user.displayName || user.email.split('@')[0];
                }
            } else {
                // Якщо ключі різні, Firebase думає, що користувач не увійшов
                console.warn("Користувач не авторизований!");
                window.location.replace("index.html");
            }
        });
    } catch (error) {
        console.error("Помилка Firebase:", error);
    }
})();
// 2. БАЗА ДАННЫХ ИГР
const myGamesLibrary = [
    { name: "GTA 6", img: "img/gta6.jpg", isTop: true },
    { 
        name: "Roblox", 
        img: "img/roblox.jpg", 
        isTop: true,
        modes: [ 
            { name: "Adopt Me!", img: "img/adopt me.jpg", isTop: true }, 
            { name: "99 nights in the forest ", img: "img/99 night.jpg", isTop: true},
            { name: "Steal a Brainrot", img: "img/steal a brairot.webp", isTop: true },
            { name: "Blox fruits", img: "img/blox fruirs.jpg", isTop: true }, 
            { name: "Brookhaven ", img: "img/brookhaven.png", isTop: true }, 
            { name: "Murder mystery 2 ", img: "img/mm2.jpg", isTop: true }, 
            { name: "Evade", img: "img/evade.jpg" },
            { name: "Bee swarm simulator", img: "img/bee simulator.webp"},
            { name: "Doors", img: "img/doors.jpg" } 
        ] 
    },
    { name: "Elden Ring", img: "img/elden.jpg" },
    { name: "The Witcher 3", img: "img/witcher3.jpg" },
    { name: "Minecraft", img: "img/minecraft.jpg" }
];

document.addEventListener('DOMContentLoaded', function() {
    // --- 1. ПОЛУЧЕНИЕ ИМЕНИ ИЗ БД (username) ---
    const userNameSpan = document.getElementById('userName');
    
    // Сначала проверим, есть ли имя в локальной памяти (для скорости)
    const cachedName = localStorage.getItem('user_name');
    if (cachedName && userNameSpan) {
        userNameSpan.textContent = cachedName;
    }

    // Запрос к серверу, чтобы получить актуальное имя из колонки username
    fetch('get_user.php')
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сети или файл не найден');
            return response.json();
        })
        .then(data => {
            if (data.username && data.username !== 'Гість' && userNameSpan) {
                userNameSpan.textContent = data.username;
                localStorage.setItem('user_name', data.username); // Сохраняем для следующего раза
            }
        })
        .catch(err => console.warn("PHP профиль пока не доступен:", err));

    // --- 2. ТВОЯ ЛОГИКА НАВИГАЦИИ И ТАБОВ ---
    const addPostBtn = document.querySelector('.custom-button');
    const navButtons = document.querySelectorAll('.nav-button');
    const feedContent = document.getElementById('feed-content');
    const requestsContent = document.getElementById('requests-content');

    function showTab(tabName) {
        if (!feedContent || !requestsContent) return;
        
        if (tabName === 'feed') {
            feedContent.classList.add('active');
            requestsContent.classList.remove('active');
            if(navButtons[0]) navButtons[0].classList.add('active-tab');
            if(navButtons[1]) navButtons[1].classList.remove('active-tab');
        } else {
            requestsContent.classList.add('active');
            feedContent.classList.remove('active');
            if(navButtons[1]) navButtons[1].classList.add('active-tab');
            if(navButtons[0]) navButtons[0].classList.remove('active-tab');
        }
    }

    if (addPostBtn) {
        addPostBtn.onclick = (e) => {
            e.preventDefault();
            // Безопасный вызов редактора
            if (typeof togglePostEditor === 'function') togglePostEditor();
        };
    }

    if (navButtons.length >= 2) {
        navButtons[0].onclick = () => showTab('feed');
        navButtons[1].onclick = () => showTab('requests');
    }

    // --- 3. ЛИМИТ ТЕКСТА ---
    const postBody = document.getElementById('new-post-body');
    if (postBody) {
        postBody.oninput = function() {
            if (this.value.length >= 500) {
                this.value = this.value.substring(0, 500);
                const alertTop = document.getElementById('alert-top');
                if (alertTop) {
                    alertTop.classList.add('show');
                    setTimeout(() => alertTop.classList.remove('show'), 3000);
                }
            }
        };
    }

    // --- 4. БЕЗОПАСНЫЙ ЗАПУСК ФУНКЦИЙ ---
    if (typeof renderGames === 'function') {
        renderGames();
    }
});

// 4. ФУНКЦИИ РЕДАКТОРА
function togglePostEditor() {
    const wrapper = document.getElementById('create-post-panel');
    if (!wrapper) return;
    wrapper.classList.toggle('open');
    if (wrapper.classList.contains('open')) {
        updateGroupSelect();
        const titleInput = document.getElementById('new-post-title');
        if (titleInput) setTimeout(() => titleInput.focus(), 300);
    }
}

function updateGroupSelect() {
    const select = document.getElementById('post-target-group');
    const activeGames = document.querySelectorAll('.preview-item-wrapper');
    if (!select) return;
    select.innerHTML = '<option value="all">Усі групи</option>';
    activeGames.forEach(gameWrapper => {
        const gameTitle = gameWrapper.querySelector('.preview-mini-title');
        if (gameTitle && gameTitle.textContent.trim() !== "") {
            const name = gameTitle.textContent.trim();
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        }
    });
}

function handlePostImage(input) {
    const previewImg = document.getElementById('preview-img-tag');
    const previewText = document.querySelector('.preview-text');
    const removeBtn = document.querySelector('.remove-preview');
    const container = document.getElementById('post-image-preview-large');

    if (input.files && input.files[0]) {
        const file = input.files[0];
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("Файл занадто великий! Максимальний розмір — 2 МБ.");
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'block';
            removeBtn.style.display = 'flex';
            if (previewText) previewText.style.display = 'none';
            container.style.border = '1px solid #ddd';
        };
        reader.readAsDataURL(file);
    }
}

function clearPhotoPreview() {
    const previewImg = document.getElementById('preview-img-tag');
    const previewText = document.querySelector('.preview-text');
    const removeBtn = document.querySelector('.remove-preview');
    const fileInput = document.getElementById('post-file-input');
    const container = document.getElementById('post-image-preview-large');
    if (previewImg) {
        previewImg.src = "";
        previewImg.style.display = 'none';
    }
    if (removeBtn) removeBtn.style.display = 'none';
    if (previewText) previewText.style.display = 'block';
    if (fileInput) fileInput.value = "";
    container.style.border = '2px dashed #ccc';
}

function publishPost() {
    const title = document.getElementById('new-post-title').value;
    const body = document.getElementById('new-post-body').value;
    const targetGroup = document.getElementById('post-target-group').value;
    const previewImg = document.getElementById('preview-img-tag');
    const userNick = document.querySelector('.user-nick')?.innerText || "Gamer_Guest";

    if (title.trim() === "" && body.trim() === "") {
        alert("Напишіть що-небудь!");
        return;
    }

    const feedContainer = document.getElementById('feed-content');
    const postId = 'post-' + Date.now();
    let imgHTML = '';
    if (previewImg && previewImg.style.display !== 'none' && previewImg.src !== "") {
        imgHTML = `<div class="post-media-container"><img src="${previewImg.src}" class="post-published-image"></div>`;
    }

    const newPostHTML = `
        <div class="user-post-card">
            <div class="post-header-info">
                <strong>${userNick}</strong> • <span class="post-group-tag">@${targetGroup}</span>
            </div>
            <div class="post-content">
                <h3 class="post-title-display">${title}</h3>
                <div id="${postId}" class="post-text-container"><p>${body}</p></div>
                <div class="expand-bar" id="bar-${postId}" onclick="toggleText('${postId}')" style="display: none;">
                    <span class="expand-arrow">></span>
                </div>
                ${imgHTML}
            </div>
            <div class="post-actions">
                <div class="action-group voting" data-user-vote="0">
                    <button class="action-btn upvote" onclick="handleVote(this, 1)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    </button>
                    <span class="vote-count">0</span>
                    <button class="action-btn downvote" onclick="handleVote(this, -1)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    </button>
                </div>
                <button class="action-btn" onclick="openComments('${postId}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>Коментувати</span>
                </button>
                <button class="action-btn" onclick="window.openGiftModal()">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H4v4M2 8h20M12 3v5M7 12v10h10V12"/></svg>
    <span>Нагородити</span>
</button>
            </div>
        </div>
    `;

    if (feedContainer) {
        feedContainer.insertAdjacentHTML('afterbegin', newPostHTML);
        setTimeout(() => {
            const container = document.getElementById(postId);
            if (container && container.scrollHeight > 105) {
                document.getElementById('bar-' + postId).style.display = 'flex';
            }
        }, 50);
    }
    document.getElementById('new-post-title').value = "";
    document.getElementById('new-post-body').value = "";
    clearPhotoPreview();
    togglePostEditor();
}

// Хранилище для комментариев (в реальном проекте это была бы БД)
const commentsData = {};


function renderCommentsInterface(postId, container) {
    container.innerHTML = `
        <div class="comments-interface">
            <div class="comments-header">
                <button class="back-to-post-minimal" onclick="closeComments('${postId}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <span class="header-title">Коментарі</span>
            </div>
            
            <div class="comments-list" id="list-${postId}">
                ${renderCommentsList(commentsData[postId], postId)}
            </div>

            <div class="comment-input-wrapper">
                <textarea class="comment-input-field" id="input-${postId}" placeholder="Напишіть коментар..." rows="1"></textarea>
                <button class="send-comment-arrow" onclick="addComment('${postId}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>`;
}

// 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ (ОСТАВИТЬ ОДИН РАЗ В НАЧАЛЕ)
if (!window.commentsData) { window.commentsData = {}; }
let replyingTo = null; 

// --- ФУНКЦИИ КОММЕНТАРИЕВ ---

function openComments(postId) {
    currentPostId = postId;
    const modal = document.getElementById('comments-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    if (modal && modalContent) {
        // ПРИНУДИТЕЛЬНЫЕ СТИЛИ ЧЕРЕЗ JS (перебьют любой CSS)
        modal.style.display = 'flex';
        modal.style.alignItems = 'flex-end'; // Прижать к низу как в примере
        
        modalContent.style.width = '100%';
        modalContent.style.maxWidth = '600px'; 
        modalContent.style.height = '90vh';    // Высота 90% экрана
        modalContent.style.borderRadius = '25px 25px 0 0';
        modalContent.style.margin = '0 auto';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';

        // Рендерим список
        const listContainer = document.getElementById('modal-comments-list');
        if (!window.commentsData[postId]) {
            window.commentsData[postId] = [];
        }
        listContainer.innerHTML = renderCommentsList(window.commentsData[postId], postId);
        
        // Стили для списка, чтобы он занимал всё место и скроллился
        listContainer.style.flex = '1';
        listContainer.style.overflowY = 'auto';
        listContainer.style.padding = '20px';
    }
}

// Не забудьте обновить закрытие
function closeCommentsModal() {
    const modal = document.getElementById('comments-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function renderCommentsInterface(postId, container) {
    container.innerHTML = `
        <div class="comments-interface">
            <div class="comments-header">
                <button class="back-to-post-minimal" onclick="closeComments('${postId}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    <span>Назад</span>
                </button>
                <span class="header-title">Коментарі</span>
            </div>
            <div class="comments-list" id="list-${postId}">
                ${renderCommentsList(window.commentsData[postId], postId)}
            </div>
            <div class="comment-input-wrapper">
                <div id="reply-indicator-${postId}" class="reply-info"></div>
                <div class="input-row">
                    <textarea class="comment-input-field" id="input-${postId}" placeholder="Напишіть коментар..." rows="1"></textarea>
                    <button class="send-comment-arrow" onclick="addComment('${postId}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>`;
}

// Добавляем параметр parentName (по умолчанию null)
function renderCommentsList(comments, postId, depth = 0, parentName = null) {
    if (!comments || comments.length === 0) {
        return depth === 0 ? '<p class="no-comments">Поки що немає коментарів...</p>' : '';
    }
    
    return comments.map((comment) => {
        const isValue2 = depth > 0;
        let levelStyle = "";
        
        // Тот самый фикс, чтобы стояли идеально ровно в столбик
        if (depth > 1) {
            levelStyle = "margin-left: 0 !important; padding-left: 0 !important; border-left: none !important;";
        }

        // Логика ника в стиле TikTok:
        // Если есть parentName и это ответ (depth > 0), показываем связь
        const authorDisplay = (isValue2 && parentName) 
            ? `Gamer_Guest <span class="reply-to-user">▸ ${parentName}</span>` 
            : `Gamer_Guest`;

        return `
        <div class="modern-comment-container ${isValue2 ? 'reply-offset' : ''}" 
             id="comment-${comment.id}" 
             style="${levelStyle}">
            
            <div class="modern-comment">
                <div class="comment-avatar"></div>
                <div class="comment-content">
                    <div class="comment-author">${authorDisplay} <span>• щойно</span></div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        <div class="comment-vote">
                            <button class="${comment.userVote === 1 ? 'active-up' : ''}" onclick="voteComment('${postId}', ${comment.id}, 1)">▲</button>
                            <span>${comment.likes}</span>
                            <button class="${comment.userVote === -1 ? 'active-down' : ''}" onclick="voteComment('${postId}', ${comment.id}, -1)">▼</button>
                        </div>
                        <button class="action-link" onclick="setupReply('${postId}', ${comment.id}, 'Gamer_Guest')">Відповісти</button>
                    </div>
                </div>
            </div>

            ${comment.replies && comment.replies.length > 0 ? `
                <div class="replies-wrapper" style="margin-left: 0 !important; padding-left: 0 !important;">
                    ${depth === 0 ? `
                        <div class="replies-toggle" onclick="toggleReplies(this)">——— Сховати відповіді (${comment.replies.length})</div>
                    ` : ''}
                    
                    <div class="replies-container" style="margin-left: 0 !important; padding-left: 0 !important; border-left: none !important;">
                        ${renderCommentsList(comment.replies, postId, depth + 1, 'Gamer_Guest')}
                    </div>
                </div>
            ` : ''}
        </div>`;
    }).join('');
}
// Добавление комментария (ОДНА ФУНКЦИЯ)
function addComment(postId) {
    const input = document.getElementById('input-' + postId);
    const text = input.value.trim();
    if (!text) return;

    const newComment = { 
        id: Date.now(), 
        text: text.replace(/\n/g, '<br>'), 
        likes: 0, 
        userVote: 0, 
        replies: [] 
    };

    if (replyingTo) {
        // Рекурсивный поиск родителя (чтобы можно было отвечать на любой уровень)
        const findParent = (list) => {
            for (let c of list) {
                if (c.id === replyingTo) return c;
                if (c.replies.length > 0) {
                    const found = findParent(c.replies);
                    if (found) return found;
                }
            }
            return null;
        };
        const parent = findParent(window.commentsData[postId]);
        if (parent) parent.replies.push(newComment);
        cancelReply(postId);
    } else {
        window.commentsData[postId].push(newComment);
    }

    input.value = "";
    // Обновляем список и счетчик
    const list = document.getElementById('list-' + postId);
    list.innerHTML = renderCommentsList(window.commentsData[postId], postId);
    updatePostCommentCount(postId);
}

// Сворачивание (ОДНА ФУНКЦИЯ)
function toggleReplies(btn) {
    const container = btn.nextElementSibling;
    const isHidden = container.style.display === 'none';
    
    if (isHidden) {
        container.style.display = 'block';
        btn.innerText = `——— Сховати відповіді (${container.querySelectorAll('.modern-comment').length})`;
    } else {
        container.style.display = 'none';
        btn.innerText = `——— Дивитися відповіді (${container.querySelectorAll('.modern-comment').length})`;
    }
}

function updatePostCommentCount(postId) {
    const count = countTotalComments(window.commentsData[postId] || []);
    
    // 1. Обновляем в живом DOM
    const btnSpan = document.querySelector(`.action-btn[onclick*="${postId}"] span`);
    if (btnSpan) btnSpan.innerText = `${count} Коментувати`;
    
    // 2. Обновляем в бэкапе, чтобы при закрытии не исчезло
    if (postBackups[postId]) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = postBackups[postId];
        const backupSpan = tempDiv.querySelector('.action-btn span');
        if (backupSpan) {
            backupSpan.innerText = `${count} Коментувати`;
            postBackups[postId] = tempDiv.innerHTML;
        }
    }
}

function countTotalComments(comments) {
    let total = comments.length;
    comments.forEach(c => {
        if (c.replies) total += countTotalComments(c.replies);
    });
    return total;
}

function voteComment(postId, commentId, direction) {
    const findAndVote = (list) => {
        for (let c of list) {
            if (c.id === commentId) {
                // 1. Логика изменения счетчика
                if (c.userVote === direction) {
                    // Если нажали ту же кнопку — отменяем голос
                    // Если отменяем лайк (1), то уменьшаем. Если отменяли дизлайк (-1), ничего не делаем (так как он не уводил в минус)
                    if (direction === 1) c.likes = Math.max(0, c.likes - 1);
                    c.userVote = 0;
                } else {
                    // Если переключили голос или проголосовали впервые
                    // Сначала откатываем старый лайк, если он был
                    if (c.userVote === 1) c.likes = Math.max(0, c.likes - 1);
                    
                    // Теперь применяем новый голос
                    if (direction === 1) {
                        c.likes += 1;
                    } else if (direction === -1) {
                        // Дизлайк просто уменьшает общее число, но не ниже 0
                        c.likes = Math.max(0, c.likes - 1);
                    }
                    c.userVote = direction;
                }
                return true;
            }
            // Рекурсивный поиск в ответах (Тип 2)
            if (c.replies && c.replies.length > 0 && findAndVote(c.replies)) return true;
        }
        return false;
    };

    // Обновляем данные в массиве
    findAndVote(window.commentsData[postId]);

    // Перерисовываем список комментариев, чтобы увидеть изменения
    const listElement = document.getElementById('list-' + postId);
    if (listElement) {
        listElement.innerHTML = renderCommentsList(window.commentsData[postId], postId);
    }
}

function setupReply(postId, commentId, authorName) {
    replyingTo = commentId;
    const indicator = document.getElementById(`reply-indicator-${postId}`);
    const input = document.getElementById(`input-${postId}`);
    if (indicator) indicator.innerHTML = `Відповідь користувачу <b>${authorName}</b> <span onclick="cancelReply('${postId}')" style="cursor:pointer;color:red;margin-left:5px;">✕</span>`;
    if (input) input.focus();
}

function cancelReply(postId) {
    replyingTo = null;
    const indicator = document.getElementById(`reply-indicator-${postId}`);
    if (indicator) indicator.innerHTML = '';
}

function closeComments(postId) {
    const postCard = document.querySelector('.comments-interface')?.closest('.user-post-card');
    if (postCard && postBackups[postId]) {
        postCard.innerHTML = postBackups[postId];
    }
}

// 6. ОСТАЛЬНОЕ (ВЫБОР ИГР, ГОЛОСОВАНИЕ)
function handleVote(button, type) {
    const votingGroup = button.closest('.voting');
    const countElement = votingGroup.querySelector('.vote-count');
    const upBtn = votingGroup.querySelector('.upvote');
    const downBtn = votingGroup.querySelector('.downvote');
    
    let currentVote = parseInt(votingGroup.getAttribute('data-user-vote')) || 0;
    let currentCount = parseInt(countElement.innerText) || 0;

    // 1. Сначала полностью "откатываем" старый голос, чтобы вернуть счетчик в нейтральное состояние
    if (currentVote === 1) {
        currentCount -= 1; // Убираем лайк
    } else if (currentVote === -1) {
        // Если был дизлайк, мы его НЕ прибавляли к счетчику (так как он был 0)
        // Но если ты делал так, что дизлайк отнимал от лайков, то тут было бы += 1
        // В нашей логике "не ниже нуля" дизлайк просто нейтрализует лайк.
    }

    // 2. Определяем новое состояние
    if (currentVote === type) {
        // Если нажали ту же кнопку — оставляем 0 (голос снят)
        currentVote = 0;
    } else {
        // Ставим новый голос
        currentVote = type;
        // Если новый голос - лайк, прибавляем 1
        if (currentVote === 1) {
            currentCount += 1;
        }
        // Если новый голос - дизлайк, уменьшаем (но не ниже 0)
        if (currentVote === -1) {
            currentCount = Math.max(0, currentCount - 1);
        }
    }

    // Финальная проверка на всякий случай
    currentCount = Math.max(0, currentCount);

    // 3. Сохраняем и обновляем UI
    votingGroup.setAttribute('data-user-vote', currentVote);
    countElement.innerText = currentCount;

    upBtn.classList.toggle('active-up', currentVote === 1);
    downBtn.classList.toggle('active-down', currentVote === -1);
}
function toggleText(id) {
    document.getElementById(id).classList.toggle('expanded');
}

function renderGames() {
    const grid = document.getElementById('media-grid');
    const backBtn = document.getElementById('modal-back-button');
    const searchInput = document.getElementById('modal-search');
    
    if (!grid) return;
    
    // Прячем кнопку назад, но ПОИСК оставляем всегда
    if (backBtn) backBtn.style.display = 'none'; 
    if (searchInput) searchInput.style.display = 'block';

    grid.innerHTML = '';

    myGamesLibrary.forEach((game) => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.onclick = () => {
            if (game.modes) {
                openGameModes(game.name);
            } else {
                finalSelectMode(card);
            }
        };
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
    const game = myGamesLibrary.find(g => g.name === gameName);
    
    if (!game || !game.modes) return;
    
    grid.innerHTML = '';
    
    // ПОКАЗЫВАЕМ кнопку (она встанет слева от поиска благодаря flex)
    if (backBtn) backBtn.style.display = 'flex';

    game.modes.forEach((mode) => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.onclick = () => finalSelectMode(card);
        card.innerHTML = `
            <div class="media-img-container"><img src="${mode.img}"></div>
            <div class="media-title">${mode.name}</div>
        `;
        grid.appendChild(card);
    });
}

// Функция возврата
function goBackToList() {
    const backBtn = document.getElementById('modal-back-button');
    // ПРЯЧЕМ кнопку (поиск сам растянется обратно)
    if (backBtn) backBtn.style.display = 'none';
    
    renderGames();
}
function finalSelectMode(cardElement) {
    const modeName = cardElement.querySelector('.media-title').innerText.trim();
    const container = document.getElementById('media-upload-container');
    
    // 1. ПРОВЕРКА НА ДУБЛИКАТЫ
    // Собираем все названия из уже добавленных карточек
    const existingTitles = Array.from(container.querySelectorAll('.preview-mini-title'))
                                .map(el => el.innerText.trim());

    if (existingTitles.includes(modeName)) {
        // Если игра уже есть, показываем уведомление и выходим
        showTopAlert(`Гра "${modeName}" вже додана!`);
        return; 
    }

    // 2. ЕСЛИ ПРОВЕРКА ПРОЙДЕНА — ДОБАВЛЯЕМ
    const imgSrc = cardElement.querySelector('img').src;
    const target = window.currentActiveSquare;

    if (target) {
        target.innerHTML = `<img src="${imgSrc}" alt="preview">`;
        target.classList.add('filled');
        
        let titleTag = target.parentNode.querySelector('.preview-mini-title');
        if (!titleTag) {
            titleTag = document.createElement('div');
            titleTag.className = 'preview-mini-title';
            target.parentNode.appendChild(titleTag);
        }
        titleTag.innerText = modeName;

        const totalItems = container.getElementsByClassName('preview-item-wrapper').length;
        if (container && totalItems < 4) {
            createNewPlusBox(container);
        }
        
        closeGamesModal();
    }
}

function showTopAlert(message) {
    let alertBox = document.getElementById('alert-top');
    
    // Если плашки для уведомлений нет в HTML, создадим её на лету
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'alert-top';
        alertBox.style.cssText = `
            position: fixed; top: -50px; left: 50%; transform: translateX(-50%);
            background: #ff4d4d; color: white; padding: 10px 20px;
            border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;
            transition: top 0.4s ease; z-index: 9999; font-weight: bold;
        `;
        document.body.appendChild(alertBox);
    }

    alertBox.innerText = message;
    alertBox.style.top = "0"; // Показываем

    setTimeout(() => {
        alertBox.style.top = "-60px"; // Прячем через 3 секунды
    }, 3000);
}

function createNewPlusBox(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-item-wrapper';
    wrapper.innerHTML = `
        <div class="image-preview-box" onclick="addPhotoPlaceholder(this)">
            <span class="plus-icon">+</span>
        </div>
        <div class="preview-mini-title"></div>
    `;
    container.appendChild(wrapper);
}

function addPhotoPlaceholder(element) {
    if (element.classList.contains('filled')) return;
    window.currentActiveSquare = element;
    
    // Используем ID 'games-modal', так как он у вас в HTML для выбора игр
    const modal = document.getElementById('games-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderGames(); // Сбрасываем на главный список при открытии
    }
}

function closeGamesModal() {
    const modal = document.getElementById('games-modal');
    if (modal) modal.style.display = 'none';
}


// 1. Отслеживаем правый клик по иконкам игр
document.addEventListener('contextmenu', function(e) {
    // Проверяем, что нажали на иконку в боковой панели
    const targetBox = e.target.closest('.image-preview-box');
    
    // Если это иконка игры (и в ней уже есть картинка, а не просто плюс)
    if (targetBox && targetBox.querySelector('img')) {
        e.preventDefault(); // Запрещаем системное меню
        
        currentActiveTarget = targetBox;
        const menu = document.getElementById('custom-context-menu');
        const muteText = document.getElementById('mute-toggle-text');

        // Проверяем состояние: если игра уже "заглушена" (темная), меняем текст
        if (targetBox.classList.contains('muted-game')) {
            muteText.innerText = 'Включити';
        } else {
            muteText.innerText = 'Заглушити';
        }

        // Показываем меню в месте клика
        menu.style.display = 'block';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
    } else {
        // Если кликнули в другом месте — скрываем меню
        document.getElementById('custom-context-menu').style.display = 'none';
    }
});

// 2. Скрываем меню при обычном клике в любом месте
document.addEventListener('click', function() {
    document.getElementById('custom-context-menu').style.display = 'none';
});

// 3. Функция "Заглушить" (переключатель)
function mutePhoto() {
    if (currentActiveTarget) {
        currentActiveTarget.classList.toggle('muted-game');
        document.getElementById('custom-context-menu').style.display = 'none';
    }
}

// 4. Функция "Вийти" (удаление игры из панели)
function removePhoto() {
    if (currentActiveTarget) {
        // 1. Находим контейнер, где лежат все игры
        const container = document.getElementById('media-upload-container');
        
        // 2. Удаляем выбранную игру
        const wrapper = currentActiveTarget.closest('.preview-item-wrapper');
        if (wrapper) {
            wrapper.remove();
        }

        // 3. Скрываем контекстное меню
        document.getElementById('custom-context-menu').style.display = 'none';

        // 4. ГЛАВНОЕ ИСПРАВЛЕНИЕ: Проверяем, нужно ли вернуть плюс
        if (container) {
            // Считаем сколько элементов (игр + плюсов) сейчас есть
            const totalItems = container.querySelectorAll('.preview-item-wrapper').length;
            // Ищем, есть ли уже кнопка плюс (класс .plus-icon внутри)
            const hasPlus = container.querySelector('.plus-icon');

            // Если элементов меньше 4 И плюса нет — создаем его
            if (totalItems < 4 && !hasPlus) {
                createNewPlusBox(container);
            }
        }
    }
}

// Открытие окна ИГР
function addPhotoPlaceholder(element) {
    window.currentActiveSquare = element;
    document.getElementById('games-modal').style.display = 'flex';
    renderGames(); // Запускает отрисовку плитки
}

function closeGamesModal() {
    document.getElementById('games-modal').style.display = 'none';
}

// Открытие окна КОММЕНТАРИЕВ
// ОДНА ЕДИНАЯ ФУНКЦИЯ ОТКРЫТИЯ
function openComments(postId) {
    const postCard = document.getElementById(postId)?.closest('.user-post-card');
    if (!postCard) return;
    
    // Сохраняем исходный вид поста, чтобы потом вернуться из комментариев
    if (!postBackups[postId]) { 
        postBackups[postId] = postCard.innerHTML; 
    }
    
    // Инициализируем данные, если их нет
    if (!window.commentsData[postId]) { 
        window.commentsData[postId] = []; 
    }

    // Рисуем интерфейс комментариев прямо внутри карточки поста
    renderCommentsInterface(postId, postCard);
}

// ФУНКЦИЯ ЗАКРЫТИЯ
function closeComments(postId) {
    const postCard = document.querySelector('.comments-interface')?.closest('.user-post-card');
    if (postCard && postBackups[postId]) {
        // Возвращаем пост в исходный вид из бэкапа
        postCard.innerHTML = postBackups[postId];
        // После возврата нужно обновить счетчик на кнопке, если добавились новые комменты
        updatePostCommentCount(postId);
    }
}

// Функция, которая вызывается при клике на игру для открытия подробностей
function openGameDetails(gameData) {
    // 1. Показываем кнопку назад
    document.getElementById('modal-back-button').style.display = 'flex';
    
    // 2. Скрываем основной список игр и поиск
    document.getElementById('games-grid-container').style.display = 'none';
    document.getElementById('modal-search-input').style.display = 'none';
    
    // 3. Показываем блок с деталями игры (создайте его, если нет)
    const detailsContainer = document.getElementById('game-details-view');
    detailsContainer.style.display = 'block';
    // ... логика наполнения данными игры ...
}

// Обработчик для кнопки "Назад"
document.getElementById('modal-back-button').addEventListener('click', function() {
    // 1. Скрываем саму кнопку
    this.style.display = 'none';
    
    // 2. Показываем список игр и поиск обратно
    document.getElementById('games-grid-container').style.display = 'grid';
    document.getElementById('modal-search-input').style.display = 'block';
    
    // 3. Скрываем блок деталей
    document.getElementById('game-details-view').style.display = 'none';
});

function showGameDetails() {
    // Показываем кнопку назад
    document.getElementById('modal-back-button').style.display = 'flex';
    
    // Скрываем заголовок "Виберіть гру", поиск и сетку
    document.querySelector('.modal-games-header h3').style.display = 'none';
    document.getElementById('modal-search').style.display = 'none';
    document.getElementById('media-grid').style.display = 'none';
    
    // Здесь должен быть ваш код для показа контента конкретной игры
}

function goBackToGamesList() {
    // Скрываем кнопку назад
    document.getElementById('modal-back-button').style.display = 'none';
    
    // Возвращаем заголовок, поиск и сетку
    document.querySelector('.modal-games-header h3').style.display = 'block';
    document.getElementById('modal-search').style.display = 'block';
    document.getElementById('media-grid').style.display = 'grid';
    
    // Если вы создавали блок с описанием игры, скройте его
    // document.getElementById('game-details-container').style.display = 'none';
}

// 1. ФУНКЦИЯ ПЕРЕХОДА (вызывайте её, когда кликаете на игру в списке)
function openGamePage() {
    // Показываем кнопку "Назад"
    document.getElementById('modal-back-button').style.display = 'flex';
    
    // Скрываем заголовок, поиск и сетку игр
    document.getElementById('modal-games-main-title').style.display = 'none';
    document.getElementById('modal-search').style.display = 'none';
    document.getElementById('media-grid').style.display = 'none';
    
    // Показываем блок с деталями игры
    const details = document.getElementById('game-details-view');
    if(details) details.style.display = 'block';
 } 

// Внутри home.js функция загрузки
function syncName() {
    fetch('get_user.php')
    .then(res => res.json())
    .then(data => {
        const nameBlock = document.getElementById('userName');
        if (nameBlock && data.username) {
            nameBlock.textContent = data.username;
        }
    });
}

// Вызывай её при загрузке страницы
document.addEventListener('DOMContentLoaded', syncName);

  // Добавим действие при клике на аватарку (например, вызов меню выхода)
 // Добавим действие при клике на аватарку
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен, ищу блок userName...");

    fetch('get_user.php')
    .then(response => response.json()) // Теперь можно сразу json, раз мы знаем, что ответ чистый
    .then(data => {
        console.log("Данные получены:", data);

        // Замени блок в home.js на этот:
     if (data.username && data.username !== 'Гість') {
    const nameElement = document.getElementById('userName');
    const nickLabel = document.querySelector('.user-nick'); // Проверь, может у тебя такой класс на главной?

    if (nameElement) {
        nameElement.textContent = data.username;
    } 
    
    // Если на главной странице блок называется .user-nick, обновим и его
    if (nickLabel) {
        nickLabel.textContent = data.username;
    }
}
    })
    .catch(err => {
        console.error("Ошибка при получении имени:", err);
    });
});// <-- ВОТ ЭТА СКОБКА БЫЛА ПРОПУЩЕНА

function listenToPosts() { console.log("Заглушка для listenToPosts"); }

// === ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК (ЛЕНТА / ЗАЯВКИ / БЛОГ) ===

// 1. Функция переключения
window.switchTab = function(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    // Убираем подсветку кнопок
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active-tab');
    });

    // Показываем нужную вкладку
    const targetContent = document.getElementById(tabName + '-content');
    if (targetContent) {
        targetContent.style.display = 'block';
        targetContent.classList.add('active');
    }

    // Подсвечиваем кнопку (находим по тексту или onclick, но проще так)
    const buttons = document.querySelectorAll('.nav-button');
    if (tabName === 'feed') buttons[0].classList.add('active-tab');
    if (tabName === 'requests') buttons[1].classList.add('active-tab');
    if (tabName === 'blog') buttons[2].classList.add('active-tab');
};

// 2. Проверка ссылки при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Получаем параметры из URL (например ?tab=blog)
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');

    if (tab === 'blog') {
        switchTab('blog'); // Если в ссылке blog -> открываем блог
    } else if (tab === 'requests') {
        switchTab('requests');
    } else {
        switchTab('feed'); // По умолчанию лента
    }
});

// ==========================================
// ЛОГІКА ПЕРЕМИКАННЯ ВКЛАДОК (ОНОВЛЕНА)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Функція перемикання
    function performSwitch(tabName) {
        console.log("Клік по вкладці:", tabName);

        // Ховаємо всі блоки контенту
        document.querySelectorAll('.tab-content').forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
        });

        // Прибираємо підсвічування кнопок
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active-tab');
        });

        // Показуємо потрібний контент
        const target = document.getElementById(tabName + '-content');
        if (target) {
            target.style.display = 'block';
            setTimeout(() => target.classList.add('active'), 10); // Для анімації
        } else {
            console.error("Блок контенту не знайдено:", tabName + '-content');
        }

        // Підсвічуємо потрібну кнопку
        if (tabName === 'feed') document.getElementById('btn-feed')?.classList.add('active-tab');
        if (tabName === 'requests') document.getElementById('btn-requests')?.classList.add('active-tab');
        if (tabName === 'blog') document.getElementById('btn-blog')?.classList.add('active-tab');
    }

    // 2. Навішуємо події на кнопки (Залізобетонний метод)
    const btnFeed = document.getElementById('btn-feed');
    const btnRequests = document.getElementById('btn-requests');
    const btnBlog = document.getElementById('btn-blog');

    if (btnFeed) btnFeed.addEventListener('click', () => performSwitch('feed'));
    if (btnRequests) btnRequests.addEventListener('click', () => performSwitch('requests'));
    if (btnBlog) btnBlog.addEventListener('click', () => performSwitch('blog'));

    // 3. Перевірка посилання при старті (якщо прийшли з профілю)
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');

    if (tab === 'blog') {
        performSwitch('blog');
    } else if (tab === 'requests') {
        performSwitch('requests');
    } else {
        performSwitch('feed'); // За замовчуванням
    }
});

// Зробимо функції глобальними
window.openGiftModal = function() {
    let modal = document.getElementById('giftModal');
    if (!modal) {
        // Якщо модалки немає, створюємо її "на льоту"
        const modalHTML = `
        <div id="giftModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center;">
            <div style="background:#1e1e1e; padding:20px; border-radius:15px; width:300px; text-align:center; border:1px solid #333;">
                <h3 style="color:white; margin-bottom:15px;">Оберіть нагороду</h3>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
                    <div onclick="window.sendGift('https://cdn-icons-png.flaticon.com/512/616/616490.png', 'Кристал')" style="cursor:pointer; background:#2a2a2a; padding:10px; border-radius:10px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/616/616490.png" style="width:40px;">
                    </div>
                    <div onclick="window.sendGift('https://cdn-icons-png.flaticon.com/512/3533/3533961.png', 'Меч')" style="cursor:pointer; background:#2a2a2a; padding:10px; border-radius:10px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/3533/3533961.png" style="width:40px;">
                    </div>
                    <div onclick="window.sendGift('https://cdn-icons-png.flaticon.com/512/1041/1041844.png', 'Корона')" style="cursor:pointer; background:#2a2a2a; padding:10px; border-radius:10px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/1041/1041844.png" style="width:40px;">
                    </div>
                </div>
                <button onclick="window.closeGiftModal()" style="margin-top:15px; background:#4e5058; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Закрити</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('giftModal');
    }
    modal.style.display = 'flex';
};

window.closeGiftModal = function() {
    const modal = document.getElementById('giftModal');
    if (modal) modal.style.display = 'none';
};

window.sendGift = function(imgSrc, name) {
    // 1. Беремо старі дані
    let gifts = JSON.parse(localStorage.getItem('my_shared_gifts')) || [];
    // 2. Додаємо новий
    gifts.push({ src: imgSrc, name: name });
    // 3. Зберігаємо під новим унікальним ключем
    localStorage.setItem('my_shared_gifts', JSON.stringify(gifts));
    
    alert(`Подарунок "${name}" відправлено!`);
    window.closeGiftModal();
};