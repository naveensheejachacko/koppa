import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  VISIT_RADIUS_METERS: z.coerce.number().positive().default(120),
  VISIT_MAX_GPS_ACCURACY_METERS: z.coerce.number().positive().default(50),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).optional(),
  ADMIN_BOOTSTRAP_USERNAME: z.string().min(3).optional(),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function loadEnv(overrides?: Record<string, string | undefined>): Env {
  if (cached && !overrides) {
    return cached;
  }
  const parsed = envSchema.safeParse({ ...process.env, ...overrides });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  if (!overrides) {
    cached = parsed.data;
  }
  return parsed.data;
}

export function env(): Env {
  if (!cached) {
    cached = loadEnv();
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = undefined;
}
