import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
