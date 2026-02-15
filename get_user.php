<?php
session_start();
error_reporting(0);
header('Content-Type: application/json; charset=utf-8');

$host = '127.0.0.1';
$db   = 'mywebsite';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 1. Визначаємо, кого ми хочемо завантажити
    $currentUserId = $_SESSION['user_id'] ?? null;
    $requestedUserId = $_GET['id'] ?? null;

    // Якщо в посиланні є ID, беремо його. Якщо немає - беремо свій ID із сесії.
    $targetId = $requestedUserId ? $requestedUserId : $currentUserId;

    if ($targetId) {
        // 2. Визначаємо, чи це "мій" профіль
        $isOwnProfile = ($currentUserId && $targetId == $currentUserId);

        // [ВИПРАВЛЕНО] Прибрав дублікати колонок
        $sql = "SELECT username, `user`, avatar_url, banner_url, background_url, created_at, bio, country_code, languages_icons, secondary_email, grad_color_left, grad_color_right, status_start_hour, status_end_hour, status_last_updated, badges FROM users WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$targetId]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($res) {
            echo json_encode([
                'success' => true,
                'is_own_profile' => $isOwnProfile,
                'username' => $res['username'],
                'user' => $res['user'],
                'created_at' => $res['created_at'],
                'avatar_url' => $res['avatar_url'],
                'banner_url' => $res['banner_url'],
                'background_url' => $res['background_url'],
                'bio' => $res['bio'],
                'country_code' => $res['country_code'],
                'languages_icons' => $res['languages_icons'],
                'secondary_email' => $res['secondary_email'],
                
                // Градієнт
                'grad_color_left' => $res['grad_color_left'],
                'grad_color_right' => $res['grad_color_right'],
                
                // [ВАЖЛИВО] Додано вивід часу (раніше цього тут не було!)
                'status_start_hour' => $res['status_start_hour'],
                'status_end_hour' => $res['status_end_hour'],
                'status_last_updated' => $res['status_last_updated'],
                'badges' => $res['badges']
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Not authorized']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
exit;
?>