const fs = require('fs')
const path = require('path')
const envFile = path.join(__dirname, '/../.env')

if (fs.existsSync(envFile)) {
  const env = require('node-env-file')
  env(envFile)
}

const port = process.env.PORT || 8080
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = {
  env: process.env.NODE_ENV,
  port: port,
  app_host_port: 'localhost:' + port,
  header_host_port: 'localhost:' + port,
  twitter: {
    oauth_request_token_api_uri: 'https://api.twitter.com/oauth/request_token',
    oauth_access_token_api_uri: 'https://api.twitter.com/oauth/access_token',
    oauth_authenticate_uri: 'https://twitter.com/oauth/authenticate?oauth_token=%s',
    oauth_consumer_key: process.env.TWITTER_OAUTH_CONSUMER_KEY,
    oauth_consumer_secret: process.env.TWITTER_OAUTH_CONSUMER_SECRET,
    oauth_version: '1.0A',
    oauth_callback_uri: '/twitter-sign-in-callback',
    oauth_signature_method: 'HMAC-SHA1',
    timeout_ms: 500
  },
  auth0: {
    use_auth0: false,
    domain: 'streetmix.auth0.com',
    client_id: process.env.AUTH0_CLIENT_ID || null,
    client_secret: process.env.AUTH0_CLIENT_SECRET,
    token_api_url: 'https://streetmix.auth0.com/oauth/token',
    audience: 'https://streetmix.auth0.com/api/v2/',
    screen_name_custom_claim: 'https://twitter.com/screen_name',
    management_scope: 'read:users write:users',
    callback_uri: '/sign-in-callback'
  },
  facebook_app_id: '204327799717656',
  cookie_session_secret: process.env.COOKIE_SESSION_SECRET || 'seger handrail',
  restapi_proxy_baseuri_rel: '/api',
  restapi: {
    port: port,
    protocol: 'http://',
    baseuri: '/api'
  },
  db: {
    url: process.env.MONGOHQ_URL || 'mongodb://localhost/streetmix'
  },
  email: {
    sendgrid: {
      api_key: process.env.SENGRID_API_KEY
    },
    feedback_recipient: process.env.EMAIL_FEEDBACK_RECIPIENT || 'hello@streetmix.net',
    feedback_subject: 'Streetmix feedback',
    feedback_sender_default: 'noreply@streetmix.net'
  },
  log_level: 'debug',
  no_internet_mode: false,
  l10n: {
    transifex: {
      api_token: '1/2dc31f5ea4c9d812a6f83ac2f59786c374b3d81e'
    },
    use_local: true
  },
  geocode: {
    pelias: {
      host: 'api.geocode.earth',
      api_key: process.env.PELIAS_API_KEY || null
    }
  },
  geoip: {
    host: 'api.ipstack.com/',
    api_key: process.env.IPSTACK_API_KEY || null,
    protocol: 'http://'
  },
  redis: {
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || null
  }
}
