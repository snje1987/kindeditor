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
        init();
        break;
    case 'chunk':
        chunk('file');
        break;
    case 'check':
        check();
        break;
    default :
        alert('非法操作');
}

function init() {
    if (isset($_POST['file_id'])) {
        $file_path = WEB_ROOT . $_POST['file_id'];
        $cfg_path = $file_path . '.ucfg';
        if (!file_exists($file_path) || !file_exists($cfg_path)) {
            alert('文件不存在');
        }
        $file_size = $_POST['filesize'];
        if (filesize($file_path) != $file_size) {
            alert('文件大小不一致');
        }

        $cfg = file($cfg_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($cfg == null || $cfg == '') {
            echo json_encode(array('error' => 0, 'id' => $_POST['file_id'], 'chunks' => 0));
        } else {
            echo json_encode(array('error' => 0, 'id' => $_POST['file_id'], 'chunks' => strval($cfg[2])));
        }
    } else {
        $file_name = $_POST['filename'];
        $file_size = $_POST['filesize'];
        if ($file_size > 1073741824 || $file_size < 0) {
            alert('文件大小超过限制');
        }

        $allow = array('png', 'rar', 'zip', 'jar', 'exe', 'mp4', 'flv', 'swf', 'mp3');

        $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        if (!in_array($ext, $allow)) {
            alert('不允许的文件类型');
        }

        $path = mkname($ext);
        if ($path == '') {
            alert('文件上传失败');
        }

        $dir = dirname(WEB_ROOT . $path);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $full = WEB_ROOT . $path;
        $dh = fopen($full, 'w+');
        ftruncate($dh, $file_size);
        fclose($dh);

        $cfg_path = $full . '.ucfg';
        $dh = fopen($cfg_path, 'w+');
        fclose($dh);

        echo json_encode(array('error' => 0, 'id' => $path, 'chunks' => 0));
    }
}

function chunk($file) {
    $file_id = strval($_POST['file_id']);
    $chunks = isset($_POST['chunks']) ? intval($_POST['chunks']) : 1;
    $chunk = isset($_POST['chunk']) ? intval($_POST['chunk']) : 0;

    if (!isset($_FILES) || !isset($_FILES[$file])) {
        alert('error1');
    }
    $file = $_FILES[$file];
    if ($file['error'] != UPLOAD_ERR_OK) {
        alert('error2');
    }

    $file_path = WEB_ROOT . $file_id;
    $cfg_path = $file_path . '.ucfg';
    if (!file_exists($file_path) || !file_exists($cfg_path)) {
        alert('error3');
    }

    $tmp_name = $file['tmp_name'];
    $content = file_get_contents($tmp_name);
    $size = strlen($content);
    unlink($tmp_name);

    $dh = fopen($file_path, 'r+');

    if (flock($dh, LOCK_EX)) {

        if ($chunk == $chunks - 1) {
            fseek($dh, -1 * $size, SEEK_END);
        } else {
            fseek($dh, $size * $chunk, SEEK_SET);
        }
        fwrite($dh, $content, $size);

        $cfg = file($cfg_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($cfg == null || $cfg == '') {
            $cfg = array(
                $chunks, 0, str_repeat('0', $chunks)
            );
        }

        $cfg[2][$chunk] = '1';
        $cfg[1] = strpos($cfg[2], '0', $cfg[1]);
        if ($cfg[1] === false) {
            $cfg[1] = $chunks;
        }
        file_put_contents($cfg_path, implode("\n", $cfg));

        echo json_encode(array('error' => 0));
    } else {
        alert('error4');
    }
    fclose($dh);
}

function check() {
    $file_id = strval($_POST['file_id']);
    $file_size = intval($_POST['filesize']);
    $md5 = strval($_POST['md5']);

    $file_path = WEB_ROOT . $file_id;
    $cfg_path = $file_path . '.ucfg';
    if (!file_exists($file_path) || !file_exists($cfg_path)) {
        alert('error1');
    }

    $dh = fopen($file_path, 'r+');


    $cfg = file($cfg_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($cfg == null || $cfg == '') {
        alert('error2');
    }

    if ($cfg[0] > $cfg[1]) {
        alert('error3');
    }

    if ($file_size != filesize($file_path)) {
        unlink($file_path);
        unlink($cfg_path);
        alert('error4');
    }

    $fmd5 = md5_file($file_path);
    if ($fmd5 != $md5) {
        unlink($file_path);
        unlink($cfg_path);
        alert('error5');
    }

    unlink($cfg_path);

    echo json_encode(array('error' => 0, 'url' => $file_id, 'name' => basename($file_id)));
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
        alert('文件上传失败');
    }

    $dir = dirname(WEB_ROOT . $path);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    if (move_uploaded_file($tmp_name, WEB_ROOT . $path) === false) {
        alert("上传文件失败。");
    }

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
    echo json_encode(array('error' => 1, 'msg' => $msg));
    exit;
}
