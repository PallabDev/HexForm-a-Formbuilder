module.exports = {
    apps: [
        {
            name: "frontend",
            cwd: "/root/projects/HexForm-a-Formbuilder",
            script: "pnpm",
            args: "--filter web start",
            env: {
                NODE_ENV: "production",
                PORT: 5600,
            },
        },
        {
            name: "backend",
            cwd: "/root/projects/HexForm-a-Formbuilder",
            script: "pnpm",
            args: "--filter @repo/api start",
            env: {
                NODE_ENV: "production",
                PORT: 8600,
            },
        },
    ],
};
