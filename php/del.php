<?php
/**
 * KindEditor PHP
 *
 * 本PHP程序是演示程序，建议不要直接在实际项目中使用。
 * 如果您确定直接使用本程序，使用之前请仔细确认相关安全设置。
 *
 */
define('WEB_ROOT', dirname(__DIR__));
define('UPLOAD_DIR', 'attached');

$path = $_GET['path'];

if (strpos($path, '..') !== false) {
    echo 'not allowed';
}

if (strpos($path, '/' . UPLOAD_DIR . '/') !== 0) {
    echo 'not allowed';
}

$file = WEB_ROOT . $path;
if (!file_exists($file)) {
    echo 'not exists';
}
unlink(WEB_ROOT . $path);
echo 'success';