import app from "./app";

console.log("DATABASE_URL check:", {
  exists: !!process.env.DATABASE_URL,
  startsWith: process.env.DATABASE_URL?.slice(0, 45),
  includesPooler: process.env.DATABASE_URL?.includes("pooler.supabase.com"),
  includesProjectUser: process.env.DATABASE_URL?.includes("postgres.zpvisupiqrtjllavblim"),
});

const rawPort = process.env["PORT"];


if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
