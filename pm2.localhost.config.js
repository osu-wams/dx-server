module.exports = {
  apps: [
    {
      name: 'dx-server',
      script: 'dist/index.js',
      watch: ['dist'],
      instances: 2,
      env: {
        NODE_ENV: 'localhost',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      env_stage: {
        NODE_ENV: 'stage',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
