module.exports = {
    apps: [{
      name: 'API',
      script: '/home/api/index.js',
      watch: false,
      cron_restart: '0 0 * * *',
    }]
  }
  