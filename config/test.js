const port = 3000

module.exports = {
  port: port,
  app_host_port: 'localhost:' + port,
  header_host_port: 'localhost:' + port,
  restapi: {
    port: port,
    baseuri: '/api'
  },
  db: {
    url: 'mongodb://127.0.0.1:27017/streetmix_test'
  },
  email: {
    feedback_recipient: 'nobody@example.com'
  },
  l10n: {
    use_local: true
  }
}
