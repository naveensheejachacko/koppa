import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./database/prisma.js";

const app = createApp();
const config = env();

const server = app.listen(config.PORT, () => {
  console.log(`Koppa API listening on :${config.PORT}`);
});

async function shutdown(): Promise<void> {
  server.close();
  await prisma.$disconnect();
}

process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});

export default app;
