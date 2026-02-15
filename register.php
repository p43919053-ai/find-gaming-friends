<?php
// 1. Настройки сессии
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'secure' => true,      
    'httponly' => true,
    'samesite' => 'None'   
]);

session_start();
header('Content-Type: application/json');

// Получаем JSON от фронтенда
$input = file_get_contents('php://input');
$data = json_decode($input, true);

try {
    // ==========================================
    // НАЧАЛО: Умное подключение к базе данных
    // ==========================================
    
    // Проверяем, дал ли нам Render секретную ссылку
    $databaseUrl = getenv('DATABASE_URL');

    if ($databaseUrl) {
        // === МЫ НА RENDER (PostgreSQL) ===
        $dbopts = parse_url($databaseUrl);
        
        $host = $dbopts["host"];
        $port = $dbopts["port"];
        $user = $dbopts["user"];
        $pass = $dbopts["pass"];
        $dbname = ltrim($dbopts["path"],'/'); // Убираем слэш в начале

        // Используем драйвер pgsql
        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    } else {
        // === МЫ ДОМА (Localhost MySQL) ===
        $host = '127.0.0.1';
        $db   = 'mywebsite';
        $user = 'root';
        $pass = '';
        
        // Используем драйвер mysql
        $dsn = "mysql:host=$host;dbname=$db;charset=utf8";
    }

    // Создаем подключение
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    // ==========================================
    // КОНЕЦ: Подключение готово
    // ==========================================

    if (!$data) throw new Exception("Данные не получены");

    $email = $data['email'] ?? '';
    // Безопасное получение имени (если username нет, берем часть до @)
    $inputName = $data['username'] ?? explode('@', $email)[0];
    $provider = $data['provider'] ?? 'email';
    $uid = $data['uid'] ?? $email;

    if (!$email) throw new Exception("Email обязателен");

    // 1. Проверяем, есть ли пользователь
    $stmt = $pdo->prepare("SELECT id, username, avatar_url, banner_url FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingUser) {
        // Пользователь существует -> Авторизация
        $userId = $existingUser['id'];
        $finalName = $existingUser['username'];
        $avatar = $existingUser['avatar_url'];
        $banner = $existingUser['banner_url'];
        
        // Если пытаются зарегистрироваться через email повторно
        if ($provider === 'email' && !isset($data['isLogin'])) {
             echo json_encode(['success' => false, 'message' => 'Ця пошта вже зайнята']);
             exit;
        }
    } else {
        // Пользователя нет -> Регистрация
        $pdo->beginTransaction();
        
        // ВАЖНО: PostgreSQL требует, чтобы поля в таблице точно совпадали
        $stmt1 = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt1->execute([$inputName, $email, password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT)]);
        
        $userId = $pdo->lastInsertId();
        
        $finalName = $inputName;
        $avatar = null;
        $banner = null;

        $stmt2 = $pdo->prepare("INSERT INTO user_auth (user_id, provider, provider_key) VALUES (?, ?, ?)");
        $stmt2->execute([$userId, $provider, $uid]);
        
        $pdo->commit();
    }

    // Сохраняем в сессию
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $finalName;
    
    session_write_close();

    // Ответ фронтенду
    echo json_encode([
        'success' => true, 
        'username' => $finalName,
        'avatar' => $avatar,
        'banner' => $banner
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    // Логируем ошибку, чтобы увидеть её в Render Logs, если что-то пойдет не так
    error_log("Database Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
