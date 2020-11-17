module.exports = {
  apps : [{
    name: 'euruspro-lis',
    script: './main.js',
    watch: ['./config/reset'],
    watch_delay: 5000,
    watch_options: {
      "followSymlinks": false
    }
  }],
};
