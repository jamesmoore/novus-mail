import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    MAIL_COUNT_PER_PAGE: z.string().optional().default("50").transform((s) => parseInt(s, 10)).pipe(z.number().min(1)),
    MAIL_REFRESH_INTERVAL: z.string().optional().default("3").transform((s) => parseInt(s, 10)).pipe(z.number().min(1)),

    OIDC_CLIENT_ID: z.string().min(1).optional(),
    OIDC_CLIENT_SECRET: z.string().min(10).optional(),
    OIDC_ISSUER: z.union([z.string().url().nullish(), z.literal("")]),
    REDIRECT_URI: z.union([z.string().url().nullish(), z.literal("")]),
    SESSION_SECRET: z.string().optional().default('342b4b79-9d2d-49cc-851a-7e3e48fd2efd'),

    CORS_ALLOW_ALL_ORIGINS: z.string().default('false').transform((s) => s.toLowerCase() !== "false" && s !== "0"),
    TRUST_PROXY: z.string().default('false').transform((s) => s.toLowerCase() !== "false" && s !== "0"),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: "PUBLIC_",

  client: {
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
});

console.log("Environment variables:");
for (const property of Object.keys(env) as Array<keyof typeof env>) {
  const isSecret = property.toLowerCase().includes("secret");
  const value = env[property];
  if (!isSecret || !value) {
    console.log(`\t${property}: ${value}`);
  } else {
    console.log(`\t${property}: [REDACTED]`);
  }
}