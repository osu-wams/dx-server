module.exports = {
  apps: [
    {
      name: 'dx-server',
      script: 'src/index.ts',
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
