-- DDL para la base de datos de PostgreSQL
-- Esquema: pd_jose_loaiza_van_rossum

--Create table for clients
CREATE TABLE clients (
	client_id SERIAL PRIMARY KEY NOT NULL,
	name VARCHAR(255) NOT NULL,
	number_document INT NOT NULL,
	adress VARCHAR(255),
	phone VARCHAR(255),
	email VARCHAR(255) UNIQUE
);

--Create data types
CREATE TYPE status AS ENUM('Pendiente','Fallida','Completada');
CREATE TYPE type AS ENUM('Pago de Factura');
CREATE TYPE platform AS ENUM('Nequi','Daviplata');

--Create table for transactions
CREATE TABLE transactions (
	transaction_id SERIAL PRIMARY KEY NOT NULL,
	date_transaction TIMESTAMP NOT NULL,
	amount_transaction INT NOT NULL,
	status_transaction status NOT NULL,
	type_transaction type
);

--Create table for bills
CREATE TABLE bills (
	bill_id SERIAL PRIMARY KEY NOT NULL,
	billing_period VARCHAR(255) NOT NULL,
	bill_amount INT NOT NULL,
	paid_amount INT NOT NULL,
	platform_used platform,
	client_id INT NOT NULL,
	transaction_id INT NOT NULL,

	FOREIGN KEY (client_id)
	REFERENCES clients(client_id),
	FOREIGN KEY (transaction_id)
	REFERENCES transactions(transaction_id)
);

--Delete tables
DROP TABLE bills CASCADE;
DROP TABLE clients CASCADE;
DROP TABLE transactions CASCADE;

--Show content tables
SELECT * FROM clients;
SELECT * FROM transactions;
SELECT * FROM bills;