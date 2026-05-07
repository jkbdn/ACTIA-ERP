module.exports = {
  apps: [
    {
      name: "actia-erp",
      script: "node_modules/next/dist/bin/next",
      args: "dev",
      cwd: "C:\\actia-erp",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      watch: false,
      autorestart: true,
    },
  ],
};
