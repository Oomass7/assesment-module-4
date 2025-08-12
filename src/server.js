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

// CUSTOMERS CRUD ENDPOINTS

// GET all customers
app.get('/api/clients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC'); // CAMBIO: Usamos pool.query
        res.json({ success: true, data: result.rows }); // CAMBIO: El resultado está en .rows
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET customer by ID
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

// POST create customer
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

// PUT update customer
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

// DELETE customer
app.delete('/api/customers/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM transactions WHERE invoice_id IN (SELECT invoice_id FROM invoices WHERE customer_id = $1)', [req.params.id]);
        await client.query('DELETE FROM invoices WHERE customer_id = $1', [req.params.id]);
        const result = await client.query('DELETE FROM customers WHERE customer_id = $1', [req.params.id]);
        
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

// CSV BULK LOAD ENDPOINT
app.post('/api/bulk-load', upload.single('csvFile'), async (req, res) => {
    const client = await pool.connect();
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
        }

        await client.query('BEGIN');
        
        const results = [];
        const errors = [];
        let processedCount = 0;

        const csvData = await new Promise((resolve, reject) => {
            const data = [];
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => data.push(row))
                .on('end', () => resolve(data))
                .on('error', reject);
        });

        for (const row of csvData) {
            try {
                if (!row.customer_name || !row.invoice_number) continue;

                let customerId;
                const existingCustomer = await client.query(
                    'SELECT client_id FROM client WHERE email = $1',
                    [row.email]
                );

                if (existingCustomer.rows.length > 0) {
                    customerId = existingCustomer.rows[0].customer_id;
                } else {
                    const customerResult = await client.query(
                        'INSERT INTO customers (customer_name, email, phone, address, city, registration_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING customer_id',
                        [row.customer_name, row.email, row.phone, row.address, row.city, row.registration_date]
                    );
                    customerId = customerResult.rows[0].customer_id;
                }

                let invoiceId;
                const existingInvoice = await client.query(
                    'SELECT invoice_id FROM invoices WHERE invoice_number = $1',
                    [row.invoice_number]
                );

                if (existingInvoice.rows.length > 0) {
                    invoiceId = existingInvoice.rows[0].invoice_id;
                } else {
                    const invoiceResult = await client.query(
                        'INSERT INTO invoices (customer_id, invoice_number, total_amount, paid_amount, status, issue_date, due_date, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING invoice_id',
                        [customerId, row.invoice_number, row.total_amount, row.paid_amount, row.invoice_status, row.issue_date, row.due_date, row.description]
                    );
                    invoiceId = invoiceResult.rows[0].invoice_id;
                }

                if (row.platform_name && row.transaction_reference && row.transaction_amount) {
                    const platform = await client.query(
                        'SELECT platform_id FROM platforms WHERE platform_name = $1',
                        [row.platform_name]
                    );

                    if (platform.rows.length > 0) {
                        await client.query(
                            'INSERT INTO transactions (invoice_id, platform_id, transaction_reference, amount, transaction_date, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (transaction_reference) DO NOTHING', // CAMBIO: Agregado ON CONFLICT para evitar duplicados
                            [invoiceId, platform.rows[0].platform_id, row.transaction_reference, row.transaction_amount, row.transaction_date, row.transaction_status, row.notes]
                        );
                    }
                }

                processedCount++;
                results.push({ row: processedCount, status: 'success' });

            } catch (rowError) {
                errors.push({ row: processedCount + 1, error: rowError.message });
            }
        }

        await client.query('COMMIT');
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: `Bulk load completed. ${processedCount} records processed.`,
            processed: processedCount,
            errors: errors.length,
            errorDetails: errors
        });

    } catch (error) {
        await client.query('ROLLBACK'); // CAMBIO: client.query('ROLLBACK') en lugar de connection.rollback()
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release(); // CAMBIO: client.release()
    }
});

// Get all platforms
app.get('/api/platforms', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM platforms WHERE status = $1', ['active']); // CAMBIO: Placeholder $1
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