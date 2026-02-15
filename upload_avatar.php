<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Перевірка авторизації
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Не авторизовано']);
    exit;
}

$userId = $_SESSION['user_id'];

// 1. Визначаємо, що за файл прийшов
$fileKey = null;
if (isset($_FILES['banner'])) $fileKey = 'banner';
elseif (isset($_FILES['avatar'])) $fileKey = 'avatar';
elseif (isset($_FILES['background'])) $fileKey = 'background';

if (!$fileKey || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Файл не отримано або помилка завантаження']);
    exit;
}

// 2. Валідація
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
$file = $_FILES[$fileKey];
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($extension, $allowedExtensions)) {
    echo json_encode(['success' => false, 'error' => 'Недопустимий формат (тільки JPG, PNG, GIF)']);
    exit;
}

if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'Файл занадто великий (макс. 5МБ)']);
    exit;
}

// 3. Шляхи
$subDir = $fileKey . 's/'; // avatars/, banners/
$baseDir = 'uploads/';
$uploadDir = $baseDir . $subDir; // uploads/banners/

// Створення папки
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Генерація унікального імені
$fileName = $fileKey . "_" . $userId . "_" . time() . "." . $extension;
$targetPath = $uploadDir . $fileName; // uploads/banners/file.jpg

// 4. Переміщення та оновлення БД
if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;dbname=mywebsite;charset=utf8", "root", "");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $column = $fileKey . '_url'; 

        // --- ВИДАЛЕННЯ СТАРОГО ФАЙЛУ (Чудова функція!) ---
        $oldFileStmt = $pdo->prepare("SELECT $column FROM users WHERE id = ?");
        $oldFileStmt->execute([$userId]);
        $oldFilePath = $oldFileStmt->fetchColumn();
        
        // Перевіряємо, чи файл існує і чи це не той самий файл
        if ($oldFilePath && file_exists($oldFilePath) && $oldFilePath != $targetPath) {
            unlink($oldFilePath); // Видаляємо старе фото з диску
        }

        // Оновлення БД
        $stmt = $pdo->prepare("UPDATE users SET `$column` = ? WHERE id = ?");
        $stmt->execute([$targetPath, $userId]);

        // [ВАЖЛИВО] Додаємо слеш / перед шляхом для браузера
        $browserUrl = '/' . $targetPath; 

        echo json_encode([
            'success' => true,
            'url' => $browserUrl . "?t=" . time() // /uploads/banners/file.jpg?t=12345
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Помилка БД: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Не вдалося зберегти файл на диск (права доступу?)']);
}
?>