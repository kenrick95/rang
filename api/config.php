<?php
date_default_timezone_set('UTC');
header("Content-Type: text/html; charset=UTF-8");
mb_internal_encoding("UTF-8");

$settings['mwOAuthAuthorizeUrl'] = 'https://www.mediawiki.org/wiki/Special:OAuth/authorize';
$settings['mwOAuthUrl'] = 'https://www.mediawiki.org/w/index.php?title=Special:OAuth';
$settings['mwOAuthIW'] = 'mw';
$settings['apiUrl'] = 'https://id.wikipedia.org/w/api.php';
$settings['errorCode'] = 200;

$settings['gUserAgent'] = "";
$settings['gConsumerKey'] = "";
$settings['gConsumerSecret'] = "";
include("secret.php");

$settings['gTokenKey'] = '';
$settings['gTokenSecret'] = '';
$settings['loggedinUsername']  = '';
$settings['userCanDelete'] = '';

session_start();
if (isset($_SESSION['tokenKey'])) {
    $settings['gTokenKey'] = $_SESSION['tokenKey'];
    $settings['gTokenSecret'] = $_SESSION['tokenSecret'];
    if (isset($_SESSION['loggedinUsername'])) {
        $settings['loggedinUsername'] = $_SESSION['loggedinUsername'];
        $settings['userCanDelete'] = $_SESSION['userCanDelete'];
    }
}
session_write_close();
if (isset($_GET['oauth_verifier']) && $_GET['oauth_verifier']) {
    fetch_access_token();
}
