--First query advance
SELECT
  t.platform,
  t.id   AS transaction_id,
  c.name AS name,
  c.id   AS client_id,
  i.id   AS bill_id
FROM bills AS t
JOIN bills AS i
  ON i.id = t.id_bill
JOIN clients AS c
  ON c.id = i.id_client
ORDER BY t.platform NULLS LAST, c.name, i.id, t.id;


--Second query advance
SELECT clients.id, clients.name, COALESCE(SUM(invoices.paid), 0) AS paid_amount
      FROM clients
      JOIN bills ON bills.id_client = clients.id
      GROUP BY clients.id, clients.name
      ORDER BY paid_amount DESC, clients.name ASC;