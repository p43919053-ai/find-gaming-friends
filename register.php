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

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$host = '127.0.0.1';
$db   = 'mywebsite';
$user = 'root';
$pass = '';

try {
    if (!$data) throw new Exception("Данные не получены");

    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $email = $data['email'] ?? '';
    $inputName = $data['username'] ?? explode('@', $email)[0];
    $provider = $data['provider'] ?? 'email';
    $uid = $data['uid'] ?? $email;

    if (!$email) throw new Exception("Email обязателен");

    // --- ВИПРАВЛЕНО: Додано аватар та банер у SELECT ---
    $stmt = $pdo->prepare("SELECT id, username, avatar_url, banner_url FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingUser) {
        $userId = $existingUser['id'];
        $finalName = $existingUser['username'];
        $avatar = $existingUser['avatar_url'];
        $banner = $existingUser['banner_url'];
        
        if ($provider === 'email' && !isset($data['isLogin'])) {
             echo json_encode(['success' => false, 'message' => 'Ця пошта вже зайнята']);
             exit;
        }
    } else {
        $pdo->beginTransaction();
        $stmt1 = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt1->execute([$inputName, $email, password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT)]);
        
        $userId = $pdo->lastInsertId();
        $finalName = $inputName;
        $avatar = null; // Новий користувач без фото
        $banner = null;

        $stmt2 = $pdo->prepare("INSERT INTO user_auth (user_id, provider, provider_key) VALUES (?, ?, ?)");
        $stmt2->execute([$userId, $provider, $uid]);
        $pdo->commit();
    }

    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $finalName;
    
    session_write_close();

    // --- ВИПРАВЛЕНО: Тепер повертаємо всі дані для фронтенду ---
    echo json_encode([
        'success' => true, 
        'username' => $finalName,
        'avatar' => $avatar,
        'banner' => $banner
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}