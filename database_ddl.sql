-- DDL para la base de datos de PostgreSQL
-- Esquema: pd_jose_loaiza_van_rossum

-- Drop existing tables in correct order to avoid foreign key constraints
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS platforms;

CREATE TABLE clients (
	client_id SERIAL PRIMARY KEY NOT NULL,
	name VARCHAR(255) NOT NULL,
	number_document VARCHAR NOT NULL,
	adress VARCHAR(255),
	phone INT,
	email VARCHAR(255) UNIQUE
);

CREATE TYPE status AS ENUM('pending','failed','complete');
CREATE TYPE type AS ENUM('paiment bill');
CREATE TYPE platform AS ENUM('nequi','daviplata');

CREATE TABLE transactions (
	transaction_id SERIAL PRIMARY KEY NOT NULL,
	date TIMESTAMP NOT NULL,
	amount INT NOT NULL,
	status_transaction status,
	type_transaction type
);

CREATE TABLE bills (
	bill_id SERIAL PRIMARY KEY NOT NULL,
	billing_period DATE NOT NULL,
	bill_amount INT,
	paid_amount INT,
	platform_used platform NOT NULL,
	client_id INT NOT NULL,
	transaction_id INT NOT NULL,

	FOREIGN KEY (client_id)
	REFERENCES clients(client_id),
	FOREIGN KEY (transaction_id)
	REFERENCES transactions(transaction_id)
);
