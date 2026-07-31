import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
let apiReference: any = () => (req: any, res: any, next: any) => next();
try { apiReference = require("@scalar/express-api-reference").apiReference; } catch(e) { console.warn("@scalar/express-api-reference not available, /docs disabled"); }
import cookieParser from 'cookie-parser';

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env.js";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
    title: "Streamyst OpenAPI",
    version: "1.0.0",
    baseUrl: env.BASE_URL.concat("/api"),
});

const allowedOrigins = [
    "http://localhost:3000",
    ...(env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN.split(",").map((o) => o.trim()) : []),
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
                callback(null, true);
            } else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true,
    }),
);

app.use(express.json());
app.use(cookieParser())

app.get("/", (req, res) => {
    return res.json({ message: "HexForm is up and running..." });
});

app.get("/health", (req, res) => {
    return res.json({ message: "HexForm server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (_, res) => {
    return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
    "/api",
    createOpenApiExpressMiddleware({
        router: serverRouter,
        createContext,
        responseMeta: undefined,
        onError: undefined,
        maxBodySize: undefined,
    }),
);

app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
        router: serverRouter,
        createContext,
    }),
);

export default app;
