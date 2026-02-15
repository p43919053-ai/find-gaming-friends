<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Вимикаємо вивід помилок у текст, щоб не ламати JSON
error_reporting(0); 
ini_set('display_errors', 0);

$host = '127.0.0.1';
$db   = 'mywebsite'; 
$user = 'root';      
$pass = '';          

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $userId = $_SESSION['user_id'] ?? null;
    
    // Отримуємо "сирі" дані
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, true);

    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'Користувач не авторизований']);
        exit;
    }

    // 1. Отримуємо країну
    $country = $input['country'] ?? null;

    // 2. Отримуємо мови
    $rawLanguages = $input['languages'] ?? ''; 

    // ВИПРАВЛЕННЯ: Перевіряємо тип даних.
    // Якщо прийшов рядок "GB,FR", перетворюємо його в масив
    if (is_string($rawLanguages)) {
        $languagesArray = explode(',', $rawLanguages);
    } elseif (is_array($rawLanguages)) {
        $languagesArray = $rawLanguages;
    } else {
        $languagesArray = [];
    }

    // Очищуємо від зайвих пробілів та порожніх значень
    $languagesArray = array_map('trim', $languagesArray);
    $languagesArray = array_filter($languagesArray); 

    // Обмежуємо до 4 мов
    if (count($languagesArray) > 4) {
        $languagesArray = array_slice($languagesArray, 0, 4);
    }

    // Збираємо назад у рядок для запису в БД (наприклад: "GB,FR")
    $languagesString = !empty($languagesArray) ? implode(',', $languagesArray) : null;

    // Оновлюємо базу
    $stmt = $pdo->prepare("UPDATE users SET country_code = ?, languages_icons = ? WHERE id = ?");
    $stmt->execute([$country, $languagesString, $userId]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    http_response_code(500);
    // Віддаємо помилку в JSON форматі, щоб JS міг її прочитати
    echo json_encode(['success' => false, 'message' => 'Помилка бази даних: ' . $e->getMessage()]);
}
?>