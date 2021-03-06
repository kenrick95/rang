<?php
require_once("api/config.php");
?>
<!DOCTYPE html>
<html>

<head>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta charset="utf-8">
  <title>Rang - id.wikipedia</title>
  <link href="css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>

<body>
  <div class="navbar navbar-default navbar-fixed-top">
    <div class="container-fluid">
      <div class="navbar-header col-xs-2">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#rang-navbar-collapse-1" aria-expanded="false">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href=".">Rang</a>
      </div>
      <div class="collapse navbar-collapse" id="rang-navbar-collapse-1">
        <ul class="nav navbar-nav navbar-left" id="rang-status">
          <li><a>
              Diunggah oleh
              <span id="rang-status-img-user"></span>
              pada
              <span id="rang-status-img-timestamp"></span>
            </a></li>
          <li><a>
              Terakhir disunting oleh
              <span id="rang-status-rev-user"></span>
              pada
              <span id="rang-status-rev-timestamp"></span>
            </a></li>
        </ul>
        <ul class="nav navbar-nav navbar-right">
          <li><?php if (empty($settings['loggedinUsername'])) {
              ?><a href="auth.php">Auth</a><?php
                                          } else {
                                            ?><a id="rang-username" data-can-delete="<?= $settings['userCanDelete'] ?>"><?= $settings['loggedinUsername'] ?></a><?php
                                                                                                                                                              } ?></li>
        </ul>
      </div><!-- /.navbar-collapse -->
    </div>
  </div>
  <div class="container-fluid">
    <nav id="rang-nav" class="col-xs-2">
      <ul class="nav nav-pills nav-stacked">
      </ul>
    </nav>
    <main class="col-xs-10" id="rang-main">
      Memuat ...
    </main>
  </div>


  <footer class="container-fluid">
    <div style="margin-top: 2em; margin-bottom: 2em;">
      <hr style="border-color: #ccc; margin-bottom: 1em;">
      &copy; <a href="http://kenrick95.org/">Kenrick95</a>.
    </div>
  </footer>
  <script src="//tools-static.wmflabs.org/cdnjs/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
  <script src="//tools-static.wmflabs.org/cdnjs/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.min.js"></script>
  <script src="js/main.js"></script>

</body>

</html>