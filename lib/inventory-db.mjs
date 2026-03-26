import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = resolve(process.cwd(), "data");
const DB_PATH = resolve(DATA_DIR, "inventory.db");
const SEED_PATH = resolve(DATA_DIR, "inventory.json");

function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true });
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createRecordId(dataset, item) {
  const preferred =
    item.id ||
    item.hostname ||
    item.serviceTag ||
    item.codigo ||
    item.serial ||
    item.alocadoPara ||
    item.alocado ||
    item.usuario ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${slugify(dataset)}-${slugify(preferred) || crypto.randomUUID()}`;
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = String(storedHash || "").split(":");
  if (!salt || !originalHash) return false;
  const candidateHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(candidateHash, "hex"));
}

export class InventoryDatabase {
  constructor() {
    ensureDataDir();
    this.db = new DatabaseSync(DB_PATH);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS datasets (
        name TEXT PRIMARY KEY,
        position INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS dataset_fields (
        dataset_name TEXT NOT NULL,
        field_key TEXT NOT NULL,
        position INTEGER NOT NULL,
        PRIMARY KEY (dataset_name, field_key),
        FOREIGN KEY (dataset_name) REFERENCES datasets(name) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS records (
        dataset_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        data_json TEXT NOT NULL,
        PRIMARY KEY (dataset_name, record_id),
        FOREIGN KEY (dataset_name) REFERENCES datasets(name) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor',
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_user_id INTEGER,
        actor_name TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        details_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    this.ensureUserSchema();
    this.seedIfNeeded();
    this.seedDefaultUser();
  }

  ensureUserSchema() {
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").all();
    if (!tables.length) return;
    const columns = this.db.prepare("PRAGMA table_info(users)").all();
    const hasRole = columns.some((column) => column.name === "role");
    if (!hasRole) {
      this.db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'editor'");
      this.db.prepare("UPDATE users SET role = 'admin' WHERE lower(username) = 'admin'").run();
    }
    const hasActive = columns.some((column) => column.name === "active");
    if (!hasActive) {
      this.db.exec("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1");
    }
  }

  seedIfNeeded() {
    const datasetCount = this.db.prepare("SELECT COUNT(*) AS total FROM datasets").get().total;
    if (datasetCount > 0 || !existsSync(SEED_PATH)) {
      return;
    }

    const payload = JSON.parse(readFileSync(SEED_PATH, "utf-8"));
    const datasets = payload.datasets || {};
    const generatedAt = payload.generatedAt || new Date().toISOString();

    const insertDataset = this.db.prepare(
      "INSERT INTO datasets (name, position) VALUES (?, ?)",
    );
    const insertField = this.db.prepare(
      "INSERT INTO dataset_fields (dataset_name, field_key, position) VALUES (?, ?, ?)",
    );
    const insertRecord = this.db.prepare(
      "INSERT INTO records (dataset_name, record_id, position, data_json) VALUES (?, ?, ?, ?)",
    );
    const upsertMeta = this.db.prepare(
      "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    );

    this.db.exec("BEGIN");
    try {
      Object.entries(datasets).forEach(([name, items], datasetIndex) => {
        insertDataset.run(name, datasetIndex);
        const fields = [];
        const seen = new Set();

        for (const item of items) {
          for (const key of Object.keys(item)) {
            if (!seen.has(key)) {
              seen.add(key);
              fields.push(key);
            }
          }
        }

        fields.forEach((fieldKey, fieldIndex) => {
          insertField.run(name, fieldKey, fieldIndex);
        });

        items.forEach((item, itemIndex) => {
          const cleanItem = { ...item };
          delete cleanItem._recordId;
          const recordId = createRecordId(name, cleanItem);
          insertRecord.run(name, recordId, itemIndex, JSON.stringify(cleanItem));
        });
      });

      upsertMeta.run("generatedAt", generatedAt);
      upsertMeta.run("updatedAt", new Date().toISOString());
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  seedDefaultUser() {
    const total = this.db.prepare("SELECT COUNT(*) AS total FROM users").get().total;
    if (total > 0) return;
    this.db
      .prepare(
        "INSERT INTO users (username, display_name, password_hash, role, active, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("admin", "Administrador", hashPassword("admin123"), "admin", 1, new Date().toISOString());
  }

  getDatasetNames() {
    return this.db
      .prepare("SELECT name FROM datasets ORDER BY position, name")
      .all()
      .map((row) => row.name);
  }

  getFieldsMap() {
    const rows = this.db
      .prepare(
        "SELECT dataset_name, field_key FROM dataset_fields ORDER BY dataset_name, position, field_key",
      )
      .all();
    const fields = {};
    for (const row of rows) {
      if (!fields[row.dataset_name]) {
        fields[row.dataset_name] = [];
      }
      fields[row.dataset_name].push(row.field_key);
    }
    return fields;
  }

  getDatasets() {
    const names = this.getDatasetNames();
    const statement = this.db.prepare(
      "SELECT record_id, data_json FROM records WHERE dataset_name = ? ORDER BY position, record_id",
    );
    const datasets = {};
    for (const name of names) {
      datasets[name] = statement.all(name).map((row) => ({
        ...parseJson(row.data_json, {}),
        _recordId: row.record_id,
      }));
    }
    return datasets;
  }

  getMetaValue(key, fallback = "") {
    const row = this.db.prepare("SELECT value FROM meta WHERE key = ?").get(key);
    return row?.value || fallback;
  }

  computeSummary(datasets) {
    const counts = {};
    for (const [name, items] of Object.entries(datasets)) {
      counts[name] = items.length;
    }

    const colaboradores = datasets.Colaboradores || [];
    const colaboradoresComNotebook = colaboradores.filter(
      (item) => String(item.notebook || "").trim() !== "",
    ).length;

    const statusColaboradores = {};
    const areaCounts = {};
    for (const item of colaboradores) {
      const status = item.status || "Sem status";
      const area = item.area || "Sem area";
      statusColaboradores[status] = (statusColaboradores[status] || 0) + 1;
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    }

    const topAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([area, total]) => ({ area, total }));

    return {
      counts,
      colaboradoresComNotebook,
      statusColaboradores,
      topAreas,
    };
  }

  logAction({ actorUserId = null, actorName, action, targetType, targetId = "", details = {} }) {
    this.db
      .prepare(
        "INSERT INTO audit_logs (actor_user_id, actor_name, action, target_type, target_id, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        actorUserId,
        actorName || "Sistema",
        action,
        targetType,
        targetId,
        JSON.stringify(details),
        new Date().toISOString(),
      );
  }

  listAuditLogs(limit = 80) {
    return this.db
      .prepare(
        "SELECT id, actor_name, action, target_type, target_id, details_json, created_at FROM audit_logs ORDER BY id DESC LIMIT ?",
      )
      .all(Number(limit))
      .map((row) => ({
        id: row.id,
        actorName: row.actor_name,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        details: parseJson(row.details_json, {}),
        createdAt: row.created_at,
      }));
  }


  getLatestLoginMap() {
    const rows = this.db
      .prepare(
        `SELECT target_id, MAX(created_at) AS last_login_at
         FROM audit_logs
         WHERE action = 'login_succeeded' AND target_type = 'user'
         GROUP BY target_id`,
      )
      .all();
    const map = new Map();
    for (const row of rows) {
      map.set(String(row.target_id), row.last_login_at);
    }
    return map;
  }
  getInventoryPayload() {
    const datasets = this.getDatasets();
    return {
      generatedAt: this.getMetaValue("generatedAt", new Date().toISOString()),
      updatedAt: this.getMetaValue("updatedAt", new Date().toISOString()),
      summary: this.computeSummary(datasets),
      fields: this.getFieldsMap(),
      datasets,
    };
  }

  ensureDatasetExists(dataset) {
    const row = this.db.prepare("SELECT name FROM datasets WHERE name = ?").get(dataset);
    if (!row) {
      throw new Error(`Base nao encontrada: ${dataset}`);
    }
  }

  touchUpdatedAt() {
    this.db
      .prepare(
        "INSERT INTO meta (key, value) VALUES ('updatedAt', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      )
      .run(new Date().toISOString());
  }

  ensureField(dataset, fieldKey) {
    const existing = this.db
      .prepare(
        "SELECT field_key FROM dataset_fields WHERE dataset_name = ? AND field_key = ?",
      )
      .get(dataset, fieldKey);
    if (existing) return;
    const row = this.db
      .prepare(
        "SELECT COALESCE(MAX(position), -1) + 1 AS nextPosition FROM dataset_fields WHERE dataset_name = ?",
      )
      .get(dataset);
    this.db
      .prepare(
        "INSERT INTO dataset_fields (dataset_name, field_key, position) VALUES (?, ?, ?)",
      )
      .run(dataset, fieldKey, row.nextPosition);
  }

  addField(dataset, fieldKey, actor = null) {
    this.ensureDatasetExists(dataset);
    this.ensureField(dataset, fieldKey);
    this.touchUpdatedAt();
    this.logAction({
      actorUserId: actor?.id || null,
      actorName: actor?.displayName || actor?.username || "Sistema",
      action: "field_added",
      targetType: "dataset_field",
      targetId: `${dataset}:${fieldKey}`,
      details: { dataset, fieldKey },
    });
    return this.getInventoryPayload();
  }

  addRecord(dataset, record, actor = null) {
    this.ensureDatasetExists(dataset);
    const cleanRecord = { ...record };
    delete cleanRecord._recordId;

    for (const key of Object.keys(cleanRecord)) {
      this.ensureField(dataset, key);
    }

    const nextPosition = this.db
      .prepare(
        "SELECT COALESCE(MIN(position), 1) - 1 AS nextPosition FROM records WHERE dataset_name = ?",
      )
      .get(dataset).nextPosition;
    const recordId = createRecordId(dataset, cleanRecord);
    this.db
      .prepare(
        "INSERT INTO records (dataset_name, record_id, position, data_json) VALUES (?, ?, ?, ?)",
      )
      .run(dataset, recordId, nextPosition, JSON.stringify(cleanRecord));
    this.touchUpdatedAt();
    this.logAction({
      actorUserId: actor?.id || null,
      actorName: actor?.displayName || actor?.username || "Sistema",
      action: "record_created",
      targetType: dataset,
      targetId: recordId,
      details: { dataset, recordId },
    });
    return this.getInventoryPayload();
  }

  updateRecord(dataset, recordId, changes, actor = null) {
    this.ensureDatasetExists(dataset);
    const row = this.db
      .prepare(
        "SELECT data_json FROM records WHERE dataset_name = ? AND record_id = ?",
      )
      .get(dataset, recordId);
    if (!row) {
      throw new Error("Registro nao encontrado");
    }

    const current = parseJson(row.data_json, {});
    const next = { ...current, ...changes };
    delete next._recordId;

    for (const key of Object.keys(changes)) {
      this.ensureField(dataset, key);
    }

    this.db
      .prepare(
        "UPDATE records SET data_json = ? WHERE dataset_name = ? AND record_id = ?",
      )
      .run(JSON.stringify(next), dataset, recordId);
    this.touchUpdatedAt();
    this.logAction({
      actorUserId: actor?.id || null,
      actorName: actor?.displayName || actor?.username || "Sistema",
      action: "record_updated",
      targetType: dataset,
      targetId: recordId,
      details: { dataset, recordId, changes },
    });
    return this.getInventoryPayload();
  }

  deleteRecord(dataset, recordId, actor = null) {
    this.ensureDatasetExists(dataset);
    this.db
      .prepare("DELETE FROM records WHERE dataset_name = ? AND record_id = ?")
      .run(dataset, recordId);
    this.touchUpdatedAt();
    this.logAction({
      actorUserId: actor?.id || null,
      actorName: actor?.displayName || actor?.username || "Sistema",
      action: "record_deleted",
      targetType: dataset,
      targetId: recordId,
      details: { dataset, recordId },
    });
    return this.getInventoryPayload();
  }

  authenticateUser(username, password) {
    const user = this.db
      .prepare(
        "SELECT id, username, display_name, password_hash, role, active FROM users WHERE lower(username) = lower(?)",
      )
      .get(String(username || "").trim());
    if (!user || !verifyPassword(password, user.password_hash) || !user.active) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      active: Boolean(user.active),
    };
  }

  getUserById(userId) {
    const user = this.db
      .prepare("SELECT id, username, display_name, role, active FROM users WHERE id = ?")
      .get(userId);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      active: Boolean(user.active),
    };
  }

  listUsers() {
    const latestLoginMap = this.getLatestLoginMap();
    return this.db
      .prepare(
        "SELECT id, username, display_name, role, active, created_at FROM users ORDER BY lower(display_name), lower(username)",
      )
      .all()
      .map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        active: Boolean(user.active),
        createdAt: user.created_at,
        lastLoginAt: latestLoginMap.get(String(user.id)) || "",
      }));
  }

  changePassword(userId, currentPassword, newPassword, actor = null) {
    const row = this.db
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(userId);
    if (!row) {
      throw new Error("Usuario nao encontrado");
    }
    if (!String(newPassword || "").trim() || String(newPassword).trim().length < 6) {
      throw new Error("A nova senha deve ter pelo menos 6 caracteres");
    }
    if (!verifyPassword(currentPassword, row.password_hash)) {
      throw new Error("Senha atual incorreta");
    }

    this.db
      .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .run(hashPassword(newPassword), userId);

    this.logAction({
      actorUserId: actor?.id || userId,
      actorName: actor?.displayName || actor?.username || "Usuario",
      action: "password_changed",
      targetType: "user",
      targetId: String(userId),
      details: { userId },
    });

    return true;
  }


  setUserActive(targetUserId, active, actor = null) {
    const user = this.db.prepare("SELECT id, username FROM users WHERE id = ?").get(targetUserId);
    if (!user) {
      throw new Error("Usuario nao encontrado");
    }
    if (String(user.username).toLowerCase() === "admin" && !active) {
      throw new Error("O usuario admin principal nao pode ser bloqueado");
    }
    this.db.prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, targetUserId);
    this.logAction({
      actorUserId: actor?.id || null,
      actorName: actor?.displayName || actor?.username || "Sistema",
      action: active ? "user_unblocked" : "user_blocked",
      targetType: "user",
      targetId: String(targetUserId),
      details: { targetUserId, active },
    });
    return this.listUsers();
  }

  adminResetPassword(targetUserId, newPassword, actor = null) {
    const user = this.db.prepare("SELECT id FROM users WHERE id = ?").get(targetUserId);
    if (!user) {
      throw new Error("Usuario nao encontrado");
    }
    if (!String(newPassword || "").trim() || String(newPassword).trim().length < 6) {
      throw new Error("A nova senha deve ter pelo menos 6 caracteres");
    }
    this.db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(newPassword), targetUserId);
    this.logAction({
      actorUserId: actor?.id || null,
      actorName: actor?.displayName || actor?.username || "Sistema",
      action: "password_reset",
      targetType: "user",
      targetId: String(targetUserId),
      details: { targetUserId },
    });
    return true;
  }

  createUser({ username, displayName, password, role }, actor = null) {
    const normalizedUsername = String(username || "").trim();
    const normalizedDisplayName = String(displayName || "").trim();
    const normalizedRole = role === "admin" ? "admin" : "editor";
    if (!normalizedUsername || !normalizedDisplayName || !String(password || "").trim()) {
      throw new Error("Preencha usuario, nome e senha");
    }

    const existing = this.db
      .prepare("SELECT id FROM users WHERE lower(username) = lower(?)")
      .get(normalizedUsername);
    if (existing) {
      throw new Error("Ja existe um usuario com esse login");
    }

    this.db
      .prepare(
        "INSERT INTO users (username, display_name, password_hash, role, active, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        normalizedUsername,
        normalizedDisplayName,
        hashPassword(password),
        normalizedRole,
        1,
        new Date().toISOString(),
      );

    this.logAction({
      actorUserId: actor?.id || null,
      actorName: actor?.displayName || actor?.username || "Sistema",
      action: "user_created",
      targetType: "user",
      targetId: normalizedUsername,
      details: { username: normalizedUsername, role: normalizedRole },
    });

    return this.listUsers();
  }
}

export function createInventoryDatabase() {
  return new InventoryDatabase();
}
