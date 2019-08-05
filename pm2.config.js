module.exports = {
  apps: [
    {
      name: 'dx-server',
      script: 'src/index.ts',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
