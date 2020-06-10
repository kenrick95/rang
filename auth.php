<?php
require_once("api/main.php");

if (empty($settings['gTokenKey'])) {
  auth_redirect();
} else {
  if (empty($settings['loggedinUsername'])) {
    $settings['loggedinUsername'] = fetch_current_username();
  }
  if (!empty($settings['loggedinUsername'])) { // no error in above function call
    header("Location: index.php");
  }
}
