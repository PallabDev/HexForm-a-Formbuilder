module.exports = {
  apps: [
    {
      name: "hexform-backend",
      cwd: "./apps/api",
      script: "npm",
      args: "run start",
      env: {
        PORT: 8000,
        NODE_ENV: "production",
      },
    },
    {
      name: "hexform-frontend",
      cwd: "./apps/web",
      script: "npm",
      args: "run start",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};
