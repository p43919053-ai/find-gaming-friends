<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Не авторизовано']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$start = $input['start'] ?? null;
$end = $input['end'] ?? null;

// Валідація
if (!is_numeric($start) || !is_numeric($end)) {
    echo json_encode(['success' => false, 'message' => 'Некоректні дані']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=mywebsite;charset=utf8", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // [ОНОВЛЕНО] Записуємо години + оновлюємо timestamp (NOW())
    $stmt = $pdo->prepare("UPDATE users SET status_start_hour = ?, status_end_hour = ?, status_last_updated = NOW() WHERE id = ?");
    $stmt->execute([$start, $end, $_SESSION['user_id']]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Помилка БД: ' . $e->getMessage()]);
}
?>