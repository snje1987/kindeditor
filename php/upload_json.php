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

$action = 'upload';

if (isset($_POST) && isset($_POST['action'])) {
    $action = $_POST['action'];
}

switch ($action) {
    case 'upload':
        upload('file');
        break;
    case 'init':
        break;
    case 'chunk':
        break;
    case 'check':
        break;
    default :
        alert('非法操作');
}

function upload($file) {
    if (!isset($_FILES) || !isset($_FILES[$file])) {
        alert('未上传文件');
    }
    $file = $_FILES[$file];
    if ($file['error'] != UPLOAD_ERR_OK) {
        alert('文件上传失败');
    }

    $allow = array('png');

    $file_name = $file['name'];
    $tmp_name = $file['tmp_name'];
    $file_size = $file['size'];

    $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    if (!in_array($ext, $allow)) {
        alert('不允许的文件类型');
    }

    $path = mkname($ext);
    if ($path == '') {
        alert('文件上传');
    }

    $dir = dirname(WEB_ROOT . $path);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    if (move_uploaded_file($tmp_name, WEB_ROOT . $path) === false) {
        alert("上传文件失败。");
    }

    header('Content-type: text/html; charset=UTF-8');
    echo json_encode(array('error' => 0, 'url' => $path));
}

function mkname($ext) {
    $now = time();
    $filename = date('YmdHis', $now) . rand(10000, 99999) . '.' . $ext;
    $year = date('Y', $now);
    $month_day = date('md', $now);

    $path = '';
    while ($path == '') {
        $path = '/' . UPLOAD_DIR . '/' . $year . '/' . $month_day . '/' . $filename;
        if (file_exists(WEB_ROOT . $path)) {
            $path = '';
        }
    }
    return $path;
}

function alert($msg) {
    header('Content-type: text/html; charset=UTF-8');
    echo json_encode(array('error' => 1, 'message' => $msg));
    exit;
}
