# Fintech Management System

A comprehensive financial management system designed to organize and structure financial information from Fintech platforms like Nequi and Daviplata. This system transforms disorganized Excel data into a normalized SQL database with CRUD operations and advanced reporting capabilities.

## 🏗️ System Architecture

This system follows a normalized relational database design applying the first three normal forms (1NF, 2NF, 3NF) to ensure data integrity and eliminate redundancy.

## 🚀 Technologies Used

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Frontend**: HTML5, Bootstrap 5, JavaScript (Vanilla)
- **File Processing**: CSV-Parser, Multer
- **API Testing**: Postman

## 📊 Database Normalization Process

PENDIENTE

## 🗃️ Database Schema

### Tables Structure
- **clients**: Client information and registration details
- **transactions**: Individual payment transactions
- **bills**: Information about the invoices

![Database Model](docs/relational_model.png)

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14.0.0 or higher)
- MySQL Server (v8.0 or higher)
- Git

### Open the terminal of your 

### 1. Clone Repository
```bash
git clone https://github.com/Oomass7/assesment-module-4.git
cd assesment-module-4.git
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE pd_jose_loaiza_van_rossum;
USE pd_jose_loaiza_van_rossum;

-- Run DDL script
source database_ddl.sql;
```

### 4. Environment Configuration
Copy the example environment file and configure your database credentials:
```bash
cp .env.example .env
```

Edit `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pd_jose_loaiza_van_rossum
PORT=3000
```

### 5. Start Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 📱 Features

### Customer Management (CRUD)
- ✅ Create new customers with validation
- ✅ Read customer information with filtering
- ✅ Update customer details
- ✅ Delete customers (with cascade to related records)

### Advanced Reporting
1. **Customer Payment Summary**: Total payments by customer
2. **Pending Invoices Report**: Outstanding invoices with customer details
3. **Platform Transaction Analysis**: Transactions filtered by payment platform

### Bulk Data Loading
- Upload CSV files with customer, invoice, and transaction data
- Automatic data validation and processing
- Error handling and reporting

## 🔗 API Endpoints

### Customer CRUD
```http
GET    /api/customers           # Get all customers
GET    /api/customers/:id       # Get customer by ID
POST   /api/customers           # Create new customer
PUT    /api/customers/:id       # Update customer
DELETE /api/customers/:id       # Delete customer
```

### Advanced Queries
```http
GET /api/reports/customer-payments     # Total paid by each customer
GET /api/reports/pending-invoices      # Pending invoices with details
GET /api/reports/transactions-by-platform?platform=Nequi  # Platform transactions
```

### Bulk Operations
```http
POST /api/bulk-load               # Upload CSV file for bulk processing
```

## 📋 CSV Bulk Load Instructions

### CSV Format Requirements
Your CSV file must include these columns:
```
customer_name, email, phone, address, city, registration_date,
invoice_number, total_amount, paid_amount, invoice_status,
issue_date, due_date, description, platform_name,
transaction_reference, transaction_amount, transaction_date,
transaction_status, notes
```

### Loading Process
1. Prepare your CSV file with the required format
2. Use the frontend upload interface or API endpoint
3. The system will automatically:
   - Validate data integrity
   - Create customers (avoid duplicates by email)
   - Generate invoices
   - Process transactions
   - Update payment statuses

### Error Handling
- Invalid data entries are logged and skipped
- Duplicate entries are handled gracefully
- Transaction rollback on critical errors

## 🧪 API Testing with Postman

Import the provided Postman collection: `postman/fintech_api.postman_collection.json`

### Test Scenarios Included:
- Customer CRUD operations
- Advanced query validations
- Error handling tests
- Bulk upload functionality

## 💾 Sample Data

Sample CSV data is provided in `data/sample_data.csv` for testing purposes.

## 🔒 Security Considerations

- Input validation on all endpoints
- SQL injection prevention through parameterized queries
- File upload restrictions and validation
- Error handling without information disclosure

## 📈 Performance Optimizations

- Database indexes on frequently queried columns
- Connection pooling for database operations
- Efficient SQL queries with proper JOINs
- Pagination support for large datasets

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
- Verify MySQL service is running
- Check database credentials in `.env`
- Ensure database exists and DDL script was executed

**CSV Upload Fails:**
- Verify file format and required columns
- Check file size limits
- Ensure proper data types in CSV

**Frontend Not Loading:**
- Verify backend server is running on correct port
- Check browser console for JavaScript errors
- Ensure all static files are served correctly

## 📊 Advanced Query Explanations

### 1. Total Paid by Each Customer
This query aggregates all completed transactions per customer, providing insights into customer value and payment behavior.

### 2. Pending Invoices Report
Identifies overdue or partially paid invoices with customer contact information for follow-up actions.

### 3. Transactions by Platform
Analyzes payment method preferences and platform performance, supporting business intelligence decisions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer Information

- **Name**: Juan Perez
- **Clan**: ExpertSoft Development Team
- **Email**: juan.perez@expertsoft.com
- **Project**: Fintech Management System - Module 4 Performance Test

## 📞 Support

For technical support or questions about implementation, please contact the development team or create an issue in the repository.

---

*This system was developed as part of a database normalization and SQL management project, demonstrating practical application of database design principles in real-world fintech scenarios.*