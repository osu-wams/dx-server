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
      env_preview: {
        NODE_ENV: 'preview',
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
