import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { resolveCorsOrigin } from "@tonylaw/shared/network";
import {
  deleteUserRoute,
  forgotPasswordRoute,
  getUserRoute,
  internalSessionRoute,
  loginStatusRoute,
  listUsersRoute,
  registerUserRoute,
  resendVerificationRoute,
  resetPasswordRoute,
  signInRoute,
  signOutRoute,
  updateUserRoute,
  verifyEmailRoute,
  verifyUserRoute
} from "./src/modules/auth/routes";
import { reportRoute } from "./src/modules/optix/report";
import { requireSharedApiAuth } from "./src/modules/optix/require-auth";
import { securitiesRoute } from "./src/modules/optix/search";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../../.env") });

const port = Number(
  process.env.API_PORT ??
    (process.env.NODE_ENV === "production" ? process.env.PORT : undefined) ??
    3001
);

async function bootstrap() {
  const hono = new Hono();

  hono.use(
    "*",
    cors({
      origin: (origin, c) => {
        const requestOrigin = origin || c.req.header("Origin") || c.req.header("origin");
        return resolveCorsOrigin(requestOrigin) ?? (requestOrigin ? undefined : "*");
      },
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "x-auth-internal-key"],
      credentials: true
    })
  );

  hono.post("/auth/api/internal/auth/verify", verifyUserRoute);
  hono.get("/auth/api/internal/auth/session", internalSessionRoute);
  hono.post("/auth/api/public/auth/login-status", loginStatusRoute);
  hono.post("/auth/api/public/auth/sign-in", signInRoute);
  hono.get("/auth/api/public/auth/sign-out", signOutRoute);
  hono.post("/auth/api/public/auth/register", registerUserRoute);
  hono.post("/auth/api/public/auth/resend-verification", resendVerificationRoute);
  hono.post("/auth/api/public/auth/verify-email", verifyEmailRoute);
  hono.post("/auth/api/public/auth/forgot-password", forgotPasswordRoute);
  hono.post("/auth/api/public/auth/reset-password", resetPasswordRoute);
  hono.get("/auth/api/private/users", listUsersRoute);
  hono.get("/auth/api/private/users/:id", getUserRoute);
  hono.patch("/auth/api/private/users/:id", updateUserRoute);
  hono.delete("/auth/api/private/users/:id", deleteUserRoute);
  hono.get("/auth/health", (c) => c.json({ ok: true }));

  hono.use("/optix/api/report", requireSharedApiAuth);
  hono.use("/optix/api/securities", requireSharedApiAuth);
  hono.get("/optix/api/report", reportRoute);
  hono.get("/optix/api/securities", securitiesRoute);
  hono.get("/optix/health", (c) => c.json({ ok: true }));

  hono.get("/health", (c) =>
    c.json({
      ok: true,
      modules: {
        auth: true,
        optix: true
      }
    })
  );

  serve(
    {
      fetch: hono.fetch,
      port
    },
    (info) => {
      console.log(`> Unified API ready on http://localhost:${info.port}`);
    }
  );
}

bootstrap().catch((error) => {
  console.error("Failed to start unified api", error);
  process.exit(1);
});
