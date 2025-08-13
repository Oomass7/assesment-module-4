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

I only create the tables and separate the necessary data in the differents tables. In this case, only three tables, and orgnaice waht is the primary keys and foreign keys

## 🗃️ Database Schema

### Tables Structure
- **clients**: Client information and registration details
- **transactions**: Individual payment transactions
- **bills**: Information about the invoices

![alt text](<relational model.svg>)

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

### Client Management (CRUD)
- ✅ Read clients information with filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 👨‍💻 Developer Information

- **Name**: Tomas Loaiza
- **Clan**: Van Rossum
- **Email**: loaizarodrigueztomas@gmail.com
- **Project**: Fintech Management System - Module 4 Assesment

## 📞 Support

For technical support or questions about implementation, please contact the development team or create an issue in the repository.

---

*This system was developed as part of a database normalization and SQL management project, demonstrating practical application of database design principles in real-world fintech scenarios.*