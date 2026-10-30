import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { recoverInterruptedRuns } from "./agent/recover.js";
import { agentRoutes } from "./routes/agent.js";
import { listingsRoutes } from "./routes/listings.js";
import { profilesRoutes } from "./routes/profiles.js";

// localhost e 127.0.0.1 são origens diferentes para o navegador; em dev aceita as duas.
const frontOrigin = process.env.FRONT_ORIGIN ?? "http://localhost:3000";
const allowedOrigins = new Set([frontOrigin, frontOrigin.replace("//localhost", "//127.0.0.1")]);

const app = new Hono()
  .use(logger())
  .use(cors({ origin: (origin) => (allowedOrigins.has(origin) ? origin : null) }))
  .get("/health", (c) => c.json({ ok: true }))
  .route("/profiles", profilesRoutes)
  .route("/listings", listingsRoutes)
  .route("/agent", agentRoutes);

await recoverInterruptedRuns();

const port = Number(process.env.PORT ?? 3333);
serve({ fetch: app.fetch, port }, () => console.log(`API em http://localhost:${port}`));
