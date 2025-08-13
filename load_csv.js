const { Pool } = require('pg');
const csv = require('csv-parser');
const fs = require('fs');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

const pool = new Pool(dbConfig);

async function loadClients() {
    console.log('Cargando clientes...');
    const clients = [];
    fs.createReadStream('clients.csv')
        .pipe(csv())
        .on('data', (row) => {
            clients.push(row);
        })
        .on('end', async () => {
            try {
                for (const client of clients) {
                    await pool.query(
                        'INSERT INTO clients (client_id, name, number_document, adress, phone, email) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (client_id) DO NOTHING',
                        [client.id_client, client.name, client.number_document, client.adress, client.phone, client.email]
                    );
                }
                console.log('✅ Clientes cargados exitosamente');
            } catch (error) {
                console.error('❌ Error cargando clientes:', error);
            }
        });
}

async function loadTransactions() {
    console.log('Cargando transacciones...');
    const transactions = [];
    fs.createReadStream('transactions.csv')
        .pipe(csv())
        .on('data', (row) => {
            transactions.push(row);
        })
        .on('end', async () => {
            try {
                for (const transaction of transactions) {
                    await pool.query(
                        'INSERT INTO transactions (id_transaction, date_transaction, amount_transaction, estatus_transaction, type_transaction) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id_transaction) DO NOTHING',
                        [transaction.id_transaction, transaction.date_transaction, transaction.amount_transaction, transaction.estatus_transaction, transaction.type_transaction]
                    );
                }
                console.log('✅ Transacciones cargadas exitosamente');
            } catch (error) {
                console.error('❌ Error cargando transacciones:', error);
            }
        });
}

async function loadBills() {
    console.log('Cargando facturas...');
    const bills = [];
    fs.createReadStream('bills.csv')
        .pipe(csv())
        .on('data', (row) => {
            bills.push(row);
        })
        .on('end', async () => {
            try {
                for (const bill of bills) {
                    await pool.query(
                        'INSERT INTO bills (id_bill, billing_period, amount_bill, amount_paying, platform_used, id_client, id_transaction) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id_bill) DO NOTHING',
                        [bill.id_bill, bill.billing_period, bill.amount_bill, bill.amount_paying, bill.platform_used, bill.id_client, bill.id_transaction]
                    );
                }
                console.log('✅ Facturas cargadas exitosamente');
            } catch (error) {
                console.error('❌ Error cargando facturas:', error);
            }
        });
}

async function loadAllData() {
    await loadClients();
    await loadTransactions();
    await loadBills();
    pool.end();
}

loadAllData();