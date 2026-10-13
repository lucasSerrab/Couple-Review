import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** Pasta onde ficam o banco, os áudios e as fotos de perfil. Nada disso vai para o git. */
export const DATA_DIR = process.env.DATALUG_DATA ?? path.join(process.cwd(), "data");

const SCHEMA = `
create table if not exists users (
  id text primary key,
  nome text not null,
  icone text not null,
  avatar_v integer
);
create table if not exists titles (
  id text primary key,
  fonte text not null default 'tmdb',
  ext_id integer not null,
  media_type text not null,
  tipo text not null,
  titulo text not null,
  ano integer,
  poster_url text,
  sinopse text,
  generos text not null default '[]',
  elenco text not null default '[]',
  duracao integer,
  temporadas integer,
  criado_em text not null default (datetime('now')),
  unique (fonte, ext_id, media_type)
);
create table if not exists watch_sessions (
  id text primary key,
  title_id text not null references titles (id) on delete cascade,
  quem text not null,
  assistido_em text not null,
  local text not null default 'casa',
  temporada integer,
  observacao text,
  criado_por text not null references users (id),
  criado_em text not null default (datetime('now'))
);
create index if not exists watch_sessions_title_idx on watch_sessions (title_id);
create table if not exists reviews (
  id text primary key,
  session_id text not null references watch_sessions (id) on delete cascade,
  user_id text not null references users (id),
  nota real not null check (nota >= 0 and nota <= 10),
  texto text,
  resumo_ia text,
  transcricao text,
  audio_url text,
  rascunho integer not null default 0,
  criado_em text not null default (datetime('now')),
  unique (session_id, user_id)
);
create table if not exists watchlist (
  id text primary key,
  title_id text not null references titles (id) on delete cascade,
  adicionado_por text not null references users (id),
  para_quem text not null default 'ambos',
  status text not null default 'pendente',
  adicionado_em text not null default (datetime('now'))
);
create unique index if not exists watchlist_pendente_unico on watchlist (title_id) where status = 'pendente';
`;

declare global {
  var __datalugDb: DatabaseSync | undefined;
}

export function db(): DatabaseSync {
  if (globalThis.__datalugDb) return globalThis.__datalugDb;
  fs.mkdirSync(path.join(DATA_DIR, "audios"), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "avatars"), { recursive: true });
  const d = new DatabaseSync(path.join(DATA_DIR, "datalug.db"));
  d.exec("pragma journal_mode = wal; pragma foreign_keys = on;");
  d.exec(SCHEMA);
  d.prepare("insert or ignore into users (id, nome, icone) values (?, ?, ?)").run("lucas", "Lucas", "masculino");
  d.prepare("insert or ignore into users (id, nome, icone) values (?, ?, ?)").run("giovanna", "Giovanna", "feminino");
  globalThis.__datalugDb = d;
  return d;
}

export const uid = () => randomUUID();

type Param = string | number | null;

export function all<T = Record<string, unknown>>(sql: string, ...p: Param[]): T[] {
  // O SQLite devolve objetos sem protótipo; o Next só aceita objetos simples nos componentes de cliente.
  return db().prepare(sql).all(...p).map((r) => ({ ...r })) as T[];
}

export function get<T = Record<string, unknown>>(sql: string, ...p: Param[]): T | undefined {
  const r = db().prepare(sql).get(...p);
  return r ? ({ ...r } as T) : undefined;
}

export function run(sql: string, ...p: Param[]) {
  return db().prepare(sql).run(...p);
}
