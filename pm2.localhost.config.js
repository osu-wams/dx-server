module.exports = {
  apps: [
    {
      name: 'dx-server',
      script: 'dist/src/index.js',
      watch: ['dist/src'],
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
