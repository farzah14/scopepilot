export async function checkDatabaseHealth(database: { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> }) {
  await database.$queryRaw`SELECT 1`;
  return { ok: true as const };
}
