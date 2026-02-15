// 1. ЕКРАН ЗАВАНТАЖЕННЯ (SPLASH SCREEN)
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('hidden');
            setTimeout(() => splash.remove(), 500);
        }, 2000);
    }
});

// 2. УПРАВЛІННЯ МОДАЛЬНИМ ВІКНОМ
const emailBtn = document.getElementById('email-register');
const modal = document.getElementById('auth-modal');
const closeBtn = document.getElementById('close-modal');

if (emailBtn && modal) {
    emailBtn.onclick = () => {
        modal.style.display = "flex";
    };
}

if (closeBtn && modal) {
    closeBtn.onclick = () => {
        modal.style.display = "none";
    };
}

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// 3. РЕГІСТРАЦІЯ (ВІДПРАВКА НА СЕРВЕР)
const submitBtn = document.getElementById('submit-registration');

if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault(); 

        const emailField = document.getElementById('reg-email');
        const passwordField = document.getElementById('reg-password');

        if (!emailField || !passwordField) return;

        const email = emailField.value.trim();
        const password = passwordField.value.trim();

        if (email === "" || password === "") {
            alert("Будь ласка, заповніть усі поля!");
            return;
        }

        try {
            console.log("Відправка даних...");
            const response = await fetch('register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 👇 ДОДАНО ДЛЯ ОБХОДУ ПОМИЛКИ 403 NGROK
                    'ngrok-skip-browser-warning': 'true' 
                },
                body: JSON.stringify({
                    email: email,       // Змінено з user_email на email для PHP
                    password: password  // Змінено з user_password на password
                })
            });

            if (!response.ok) {
                throw new Error('Сервер повернув помилку: ' + response.status);
            }

            const result = await response.json();

            if (result.success) {
                alert("Акаунт створено успішно!");
                // Зберігаємо ім'я для home.html, якщо потрібно
                localStorage.setItem('temp_username', result.username);
                window.location.href = "home.html"; 
            } else {
                alert("Помилка: " + result.message);
            }

        } catch (error) {
            console.error("Помилка запиту:", error);
            alert("Не вдалося підключитися до сервера. Можливо, ngrok заблоковано або сервер вимкнено.");
        }
    });
}

// 4. ЛОГІКА GOOGLE
const googleBtn = document.getElementById('google-auth');
if (googleBtn) {
    googleBtn.onclick = async () => {
        const fakeGoogleData = {
            email: "google_user_" + Math.floor(Math.random() * 1000) + "@gmail.com",
            provider: "google",
            uid: "google_" + Date.now()
        };

        try {
            const response = await fetch('register.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // 👇 ДОДАНО ДЛЯ ОБХОДУ ПОМИЛКИ 403 NGROK
                    'ngrok-skip-browser-warning': 'true' 
                },
                body: JSON.stringify(fakeGoogleData)
            });
            
            const result = await response.json();
            if (result.success) {
                alert("Вхід через Google успішний!");
                window.location.href = "home.html";
            } else {
                alert("Помилка Google-входу: " + result.message);
            }
        } catch (error) {
            console.error("Ошибка Google-входа:", error);
            alert("Помилка підключення при вході через Google.");
        }
    };
}