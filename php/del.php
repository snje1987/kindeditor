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
    alert("非法操作");
}

if (strpos($path, '/' . UPLOAD_DIR . '/') !== 0) {
    alert("非法操作");
}

$file = WEB_ROOT . $path;
if (!file_exists($file)) {
    alert("文件不存在");
}
unlink(WEB_ROOT . $path);

$cfg = $file . '.ucfg';
if (file_exists($cfg)) {
    unlink($cfg);
}

echo json_encode(array('error' => 0));

function alert($msg) {
    echo json_encode(array('error' => 1, 'msg' => $msg));
    exit;
}
