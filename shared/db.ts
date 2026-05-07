import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: Database | null = null;
let initializing: Promise<Database> | null = null;

export async function initDb() {
  if (dbInstance) return dbInstance;
  if (initializing) return initializing;

  initializing = (async () => {
    const dbFile = path.resolve(__dirname, 'database.sqlite');
    
    dbInstance = await open({
      filename: dbFile,
      driver: sqlite3.Database
    });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT,
      telegram_id TEXT UNIQUE,
      plan TEXT DEFAULT 'NONE',
      balance REAL DEFAULT 0,
      inviter_id TEXT,
      two_factor_enabled INTEGER DEFAULT 0,
      two_factor_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS auth_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      category TEXT,
      service TEXT,
      link TEXT,
      price REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      discount_percent INTEGER,
      max_usages INTEGER,
      current_usages INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      subject TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount REAL,
      type TEXT, -- 'deposit', 'spend', 'referral'
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS telegram_auth_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      code TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Admin Account
  const adminEmail = "danila.misochemko@yandex.ru";
  const adminUsername = "fresko";
  const existingAdmin = await dbInstance.get("SELECT id FROM users WHERE email = ? OR username = ?", [adminEmail, adminUsername]);
  
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("D17021996", salt);
    await dbInstance.run(
      "INSERT INTO users (id, username, email, password, plan, balance) VALUES (?, ?, ?, ?, ?, ?)",
      [uuidv4(), adminUsername, adminEmail, hash, "ADMIN", 1000.0]
    );
    console.log("Admin account seeded successfully.");
  }

  return dbInstance;
})();
  return initializing;
}

export async function getDb() {
  if (!dbInstance) {
    return await initDb();
  }
  return dbInstance;
}
