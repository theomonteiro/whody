// Interface mínima de banco pras consultas da Fase 2 (contas, grupos, rankings).
// O app usa postgres.js (lib/app-db.ts); os testes usam o PGlite em memória, com o mesmo SQL.
// Datas sempre voltam como texto ("YYYY-MM-DD", via ::text) e números via ::int.

export type Exec = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;

export type Db = {
  exec: Exec;
  /** Roda `fn` numa transação. */
  tx<R>(fn: (exec: Exec) => Promise<R>): Promise<R>;
};

/** Erro de violação de unique do Postgres (23505), nos dois drivers. */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "23505";
}
