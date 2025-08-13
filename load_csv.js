import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import 'dotenv/config';
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

const mappings = [
 
  {
    file: 'clients.csv',
    table: 'clients',
    columns: ['client_id','name', 'number_document','address','phone','email']
  },
  {
    file: 'bills.csv',
    table: 'bills',
    columns: ['bill_id','billing_period','bill_amount','paid_amount','platform_used', 'client_id', 'transaction_id']
  },
  {
    file: 'transactions.csv',
    table: 'transactions',
    columns: ['transaction_id','date','amount','amount','status_transaction','type_transaction']
  }
];

async function loadCsv(filePath, table, columns) {
  if (!fs.existsSync(filePath)) {
    console.warn(Skipping: ${path.basename(filePath)} (file not found));
    return;
  }
  console.log(Loading ${path.basename(filePath)} -> ${table} (${columns.join(', ')}));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const parser = fs.createReadStream(filePath).pipe(parse({ columns: true, trim: true }));
    for await (const row of parser) {
      const values = columns.map(c => row[c]);
      const placeholders = values.map((, i) => $${i+1}).join(', ');
      const sql = INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders});
      await client.query(sql, values);
    }
    await client.query('COMMIT');
    console.log(Inserted rows into ${table});
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(Error loading ${path.basename(filePath)}:, err.message);
  } finally {
    client.release();
  }
}

(async () => {
  try {
    for (const m of mappings) {
      await loadCsv(path.join(dataDir, m.file), m.table, m.columns);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();