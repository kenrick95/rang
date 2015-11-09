<?php
require_once("config.php");
/**
 * Utility function to sign a request
 *
 * Note this doesn't properly handle the case where a parameter is set both in
 * the query string in $url and in $params, or non-scalar values in $params.
 *
 * @param string $method Generally "GET" or "POST"
 * @param string $url URL string
 * @param array $params Extra parameters for the Authorization header or post
 *  data (if application/x-www-form-urlencoded).
 *  @return string Signature
 */
function sign_request( $method, $url, $params = array() ) {
    global $settings;

    $parts = parse_url( $url );

    // We need to normalize the endpoint URL
    $scheme = isset( $parts['scheme'] ) ? $parts['scheme'] : 'http';
    $host = isset( $parts['host'] ) ? $parts['host'] : '';
    $port = isset( $parts['port'] ) ? $parts['port'] : ( $scheme == 'https' ? '443' : '80' );
    $path = isset( $parts['path'] ) ? $parts['path'] : '';
    if ( ( $scheme == 'https' && $port != '443' ) ||
        ( $scheme == 'http' && $port != '80' )
    ) {
        // Only include the port if it's not the default
        $host = "$host:$port";
    }

    // Also the parameters
    $pairs = array();
    parse_str( isset( $parts['query'] ) ? $parts['query'] : '', $query );
    $query += $params;
    unset( $query['oauth_signature'] );
    if ( $query ) {
        $query = array_combine(
            // rawurlencode follows RFC 3986 since PHP 5.3
            array_map( 'rawurlencode', array_keys( $query ) ),
            array_map( 'rawurlencode', array_values( $query ) )
        );
        ksort( $query, SORT_STRING );
        foreach ( $query as $k => $v ) {
            $pairs[] = "$k=$v";
        }
    }

    $toSign = rawurlencode( strtoupper( $method ) ) . '&' .
        rawurlencode( "$scheme://$host$path" ) . '&' .
        rawurlencode( join( '&', $pairs ) );
    $key = rawurlencode( $settings['gConsumerSecret'] ) . '&' . rawurlencode( $settings['gTokenSecret'] );
    return base64_encode( hash_hmac( 'sha1', $toSign, $key, true ) );
}

/**
 * Request authorization
 * @return void
 */
function auth_redirect() {
    global $settings;

    // First, we need to fetch a request token.
    // The request is signed with an empty token secret and no token key.
    $settings['gTokenSecret'] = '';
    $url = $settings['mwOAuthUrl'] . '/initiate';
    $url .= strpos( $url, '?' ) ? '&' : '?';
    $url .= http_build_query( array(
        'format' => 'json',

        // OAuth information
        'oauth_callback' => 'oob', // Must be "oob" for MWOAuth
        'oauth_consumer_key' => $settings['gConsumerKey'],
        'oauth_version' => '1.0',
        'oauth_nonce' => md5( microtime() . mt_rand() ),
        'oauth_timestamp' => time(),

        // We're using secret key signatures here.
        'oauth_signature_method' => 'HMAC-SHA1',
    ) );
    $signature = sign_request( 'GET', $url );
    $url .= "&oauth_signature=" . urlencode( $signature );
    $ch = curl_init();
    curl_setopt( $ch, CURLOPT_URL, $url );
    curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $ch, CURLOPT_USERAGENT, $settings['gUserAgent'] );
    curl_setopt( $ch, CURLOPT_HEADER, 0 );
    curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
    $data = curl_exec( $ch );
    if ( !$data ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Curl error: ' . htmlspecialchars( curl_error( $ch ) );
        exit(0);
    }
    curl_close( $ch );
    $token = json_decode( $data );
    if ( is_object( $token ) && isset( $token->error ) ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Error retrieving token: ' . htmlspecialchars( $token->error );
        exit(0);
    }
    if ( !is_object( $token ) || !isset( $token->key ) || !isset( $token->secret ) ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Invalid response from token request';
        exit(0);
    }

    // Now we have the request token, we need to save it for later.
    session_start();
    $_SESSION['tokenKey'] = $token->key;
    $_SESSION['tokenSecret'] = $token->secret;
    session_write_close();

    // Then we send the user off to authorize
    $url = $settings['mwOAuthAuthorizeUrl'];
    $url .= strpos( $url, '?' ) ? '&' : '?';
    $url .= http_build_query( array(
        'oauth_token' => $token->key,
        'oauth_consumer_key' => $settings['gConsumerKey'],
    ) );
    header( "Location: $url" );
    echo 'Please see <a href="' . htmlspecialchars( $url ) . '">' . htmlspecialchars( $url ) . '</a>';
}

/**
 * Handle a callback to fetch the access token
 * @return void
 */
function fetch_access_token() {
    global $settings;

    $url = $settings['mwOAuthUrl'] . '/token';
    $url .= strpos( $url, '?' ) ? '&' : '?';
    $url .= http_build_query( array(
        'format' => 'json',
        'oauth_verifier' => $_GET['oauth_verifier'],

        // OAuth information
        'oauth_consumer_key' => $settings['gConsumerKey'],
        'oauth_token' => $settings['gTokenKey'],
        'oauth_version' => '1.0',
        'oauth_nonce' => md5( microtime() . mt_rand() ),
        'oauth_timestamp' => time(),

        // We're using secret key signatures here.
        'oauth_signature_method' => 'HMAC-SHA1',
    ) );
    $signature = sign_request( 'GET', $url );
    $url .= "&oauth_signature=" . urlencode( $signature );
    $ch = curl_init();
    curl_setopt( $ch, CURLOPT_URL, $url );
    curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $ch, CURLOPT_USERAGENT, $settings['gUserAgent'] );
    curl_setopt( $ch, CURLOPT_HEADER, 0 );
    curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
    $data = curl_exec( $ch );
    if ( !$data ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Curl error: ' . htmlspecialchars( curl_error( $ch ) );
        exit(0);
    }
    $token = json_decode( $data );
    if ( is_object( $token ) && isset( $token->error ) ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Error retrieving token: ' . htmlspecialchars( $token->error );
        exit(0);
    }
    if ( !is_object( $token ) || !isset( $token->key ) || !isset( $token->secret ) ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Invalid response from token request';
        exit(0);
    }

    curl_close( $ch );

    // Save the access token
    session_start();
    $_SESSION['tokenKey'] = $settings['gTokenKey'] = $token->key;
    $_SESSION['tokenSecret'] = $settings['gTokenSecret'] = $token->secret;
    session_write_close();
}

function fetch_current_username() {
    // Fetch the username
    $ch = null;
    $res = api_query( array(
        'format' => 'json',
        'action' => 'query',
        'meta' => 'userinfo',
        'uiprop' => 'rights'
    ), $ch );

    if ( isset( $res->error->code ) && $res->error->code === 'mwoauth-invalid-authorization' ) {
        // We're not authorized!
        echo 'You haven\'t authorized this application yet!';
        echo '<hr>';
        return;
    }

    if ( !isset( $res->query->userinfo ) ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Bad API response: <pre>' . htmlspecialchars( var_export( $res, 1 ) ) . '</pre>';
        exit(0);
    }
    if ( isset( $res->query->userinfo->anon ) ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Not logged in. (How did that happen?)';
        exit(0);
    }
    $current_username = str_replace(" ", "_", trim($res->query->userinfo->name));
    session_start();
    $_SESSION['loggedinUsername'] = $settings['loggedinUsername'] = $current_username;
    $_SESSION['userCanDelete'] = $settings['userCanDelete'] = in_array("delete", $res->query->userinfo->rights);
    session_write_close();
    var_dump(in_array("delete", $res->query->userinfo->rights));

    return $current_username;
}

/**
 * Send an API query with OAuth authorization
 *
 * @param array $post Post data
 * @param object $ch Curl handle
 * @return array API results
 */
function api_query( $post, &$ch = null ) {
    global $settings;

    $headerArr = array(
        // OAuth information
        'oauth_consumer_key' => $settings['gConsumerKey'],
        'oauth_token' => $settings['gTokenKey'],
        'oauth_version' => '1.0',
        'oauth_nonce' => md5( microtime() . mt_rand() ),
        'oauth_timestamp' => time(),

        // We're using secret key signatures here.
        'oauth_signature_method' => 'HMAC-SHA1',
    );
    $signature = sign_request( 'POST', $settings['apiUrl'], $post + $headerArr );
    $headerArr['oauth_signature'] = $signature;

    $header = array();
    foreach ( $headerArr as $k => $v ) {
        $header[] = rawurlencode( $k ) . '="' . rawurlencode( $v ) . '"';
    }
    $header = 'Authorization: OAuth ' . join( ', ', $header );

    if ( !$ch ) {
        $ch = curl_init();
    }
    curl_setopt( $ch, CURLOPT_POST, true );
    curl_setopt( $ch, CURLOPT_URL, $settings['apiUrl'] );
    curl_setopt( $ch, CURLOPT_POSTFIELDS, http_build_query( $post ) );
    curl_setopt( $ch, CURLOPT_HTTPHEADER, array( $header ) );
    curl_setopt( $ch, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $ch, CURLOPT_USERAGENT, $settings['gUserAgent'] );
    curl_setopt( $ch, CURLOPT_HEADER, 0 );
    curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
    $data = curl_exec( $ch );
    if ( !$data ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Curl error: ' . htmlspecialchars( curl_error( $ch ) );
        exit(0);
    }
    $ret = json_decode( $data );
    if ( $ret === null ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Unparsable API response: <pre>' . htmlspecialchars( $data ) . '</pre>';
        exit(0);
    }
    return $ret;
}


function delete_image($pageid, $reason = '') {
    global $settings;

    $ch = null;

    // Fetch the edit token
    $res = api_query( array(
        'format' => 'json',
        'action' => 'query',
        'meta' => 'tokens',
    ), $ch );

    if ( isset( $res->error->code ) && $res->error->code === 'mwoauth-invalid-authorization' ) {
        // We're not authorized!
        echo 'You haven\'t authorized this application yet!';
        echo '<hr>';
        return;
    }
    if ( !isset( $res->query->tokens ) ) {
        header( "HTTP/1.1 {$settings['errorCode']} Internal Server Error" );
        echo 'Bad API response: <pre>' . htmlspecialchars( var_export( $res, 1 ) ) . '</pre>';
        exit(0);
    }
    $token = $res->query->tokens->csrftoken;

    // Now perform the edit
    $res = api_query( array(
      'format' => 'json',
      'action' => 'delete',
      'pageid' => $pageid,
      'reason' => $reason,
      'token' => $token
    ), $ch );

    return $res;
}
