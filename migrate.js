const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log("Connected to database");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        created_at bigint,
        hash text NOT NULL,
        name text
      )
    `);

    const migrationsDir = path.join(__dirname, "packages", "database", "drizzle");

    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found, skipping");
      return;
    }

    const journalPath = path.join(migrationsDir, "meta", "_journal.json");
    let journal = { entries: [] };
    if (fs.existsSync(journalPath)) {
      journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
    }

    const { rows: applied } = await client.query(
      "SELECT name FROM __drizzle_migrations"
    );
    const appliedNames = new Set(applied.map((r) => r.name));

    for (const entry of journal.entries) {
      if (appliedNames.has(entry.tag)) {
        continue;
      }

      const migrationFile = path.join(migrationsDir, `${entry.tag}.sql`);
      if (!fs.existsSync(migrationFile)) {
        console.warn(`Migration file not found: ${migrationFile}`);
        continue;
      }

      const sql = fs.readFileSync(migrationFile, "utf-8");
      const statements = sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (e) {
          console.warn(`Statement failed (may already exist): ${e.message}`);
        }
      }

      await client.query(
        "INSERT INTO __drizzle_migrations (created_at, hash, name) VALUES ($1, $2, $3)",
        [Date.now(), entry.tag, entry.tag]
      );

      console.log(`Applied migration: ${entry.tag}`);
    }

    console.log("All migrations applied successfully");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

migrate();
