const express = require('express');
const { Pool } = require('pg'); // CAMBIO: Usamos pg en lugar de mysql2
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,'..','public')));

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });

// Database connection configuration for PostgreSQL
const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

// Create connection pool
const pool = new Pool(dbConfig); // CAMBIO: Usamos new Pool de pg

// Test database connection
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}

// CLIENT CRUD ENDPOINTS

// GET all clients
app.get('/api/clients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC'); // CAMBIO: Usamos pool.query
        res.json({ success: true, data: result.rows }); // CAMBIO: El resultado está en .rows
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET client by ID
app.get('/api/clients/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM client WHERE client_id = $1', [req.params.id]); // CAMBIO: Placeholder $1
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create client
app.post('/api/clients', async (req, res) => {
    try {
        const { name, number_document, address, phone, email } = req.body;
        
        if (!customer_name || !registration_date) {
            return res.status(400).json({ success: false, error: 'Name and registration date are required' });
        }

        const result = await pool.query(
            'INSERT INTO customers (name, number_document, address, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING client_id', // CAMBIO: Placeholders $1, $2, etc., y RETURNING
            [name, number_document, address, phone, email]
        );

        res.status(201).json({ 
            success: true, 
            data: { client_id: result.rows[0].name, number_document, address, phone, email }
        });
    } catch (error) {
        if (error.code === '23505') { // PostgreSQL unique violation error code
            res.status(400).json({ success: false, error: 'Email already exists' });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// PUT update client
app.put('/api/clients/:id', async (req, res) => {
    try {
        const { name, number_document, address, phone, email } = req.body;
        const clientId = req.params.id;

        const result = await pool.query(
            'UPDATE customers SET name = $1, number_document = $2, address = $3, phone = $4, email = $5, WHERE client_id = $6',
            [name, number_document, address, phone, email, clientId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }

        res.json({ success: true, message: 'Client updated successfully' });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ success: false, error: 'Email already exists' });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// DELETE client
app.delete('/api/customers/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM transactions WHERE transaction_id IN (SELECT transaction_id FROM transaction WHERE customer_id = $1)', [req.params.id]);
        await client.query('DELETE FROM transactions WHERE customer_id = $1', [req.params.id]);
        const result = await client.query('DELETE FROM clients WHERE client_id = $1', [req.params.id]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Client not found' });
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Client and all associated data deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ADVANCED QUERIES (ADAPTADAS PARA POSTGRESQL)

// 1. Total paid by each customer
app.get('/api/reports/customer-payments', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.client_id,
                c.name,
                c.email,
                COALESCE(SUM(i.paid_amount), 0) as total_paid,
                COUNT(i.invoice_id) as total_invoices
            FROM customers c
            LEFT JOIN invoices i ON c.customer_id = i.customer_id
            GROUP BY c.customer_id, c.customer_name, c.email
            ORDER BY total_paid DESC
        `;
        
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Pending invoices with customer and transaction info
app.get('/api/reports/pending-invoices', async (req, res) => {
    try {
        const query = `
            SELECT 
                i.invoice_id,
                i.invoice_number,
                i.total_amount,
                i.paid_amount,
                (i.total_amount - i.paid_amount) as pending_amount,
                i.due_date,
                c.customer_name,
                c.email,
                c.phone,
                STRING_AGG(
                    CONCAT(p.platform_name, ': $', t.amount) 
                    ORDER BY t.transaction_date DESC 
                    SEPARATOR '; '
                ) as recent_transactions
            FROM invoices i
            INNER JOIN customers c ON i.customer_id = c.customer_id
            LEFT JOIN transactions t ON i.invoice_id = t.invoice_id AND t.status = 'completed'
            LEFT JOIN platforms p ON t.platform_id = p.platform_id
            WHERE i.status IN ('pending', 'partial', 'overdue')
            GROUP BY i.invoice_id, i.invoice_number, i.total_amount, i.paid_amount, 
                     i.due_date, c.customer_name, c.email, c.phone
            ORDER BY i.due_date ASC
        `;
        
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Transactions by platform
app.get('/api/reports/transactions-by-platform', async (req, res) => {
    try {
        const { platform } = req.query;
        let query = `
            SELECT 
                t.transaction_id,
                t.transaction_reference,
                t.amount,
                t.transaction_date,
                t.status as transaction_status,
                p.platform_name,
                c.customer_name,
                c.email,
                i.invoice_number,
                i.total_amount as invoice_total,
                t.notes
            FROM transactions t
            INNER JOIN platforms p ON t.platform_id = p.platform_id
            INNER JOIN invoices i ON t.invoice_id = i.invoice_id
            INNER JOIN customers c ON i.customer_id = c.customer_id
        `;
        
        const params = [];
        if (platform) {
            query += ' WHERE LOWER(p.platform_name) = LOWER($1)';
            params.push(platform);
        }
        
        query += ' ORDER BY t.transaction_date DESC';
        
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await testConnection();
});

module.exports = app;