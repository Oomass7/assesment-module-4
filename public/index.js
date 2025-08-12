// Global variables
let customers = [];
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    loadCustomers();
    loadStats();
    loadReports();

    // Set default registration date to today
    document.getElementById('registrationDate').value = new Date().toISOString().split('T')[0];

    // Add event listeners
    document.getElementById('customerSearch').addEventListener('input', filterCustomers);
    document.getElementById('statusFilter').addEventListener('change', filterCustomers);
    document.getElementById('platformFilter').addEventListener('change', loadTransactionsByPlatform);

    //
    document.getElementById('bulkUploadForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita que el formulario se envíe de la manera tradicional
    uploadCSV(); // Llama a la función de carga que ya creaste
});
});

// Utility functions
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertHtml = `
                <div class="alert alert-${type} alert-dismissible fade show fade-in" role="alert">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
    alertContainer.innerHTML = alertHtml;

    // Auto hide after 5 seconds
    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-CO');
}

// API functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Customer functions
async function loadCustomers() {
    try {
        const response = await apiCall('/clients');
        customers = response.data;
        renderCustomers(customers);
    } catch (error) {
        showAlert('Failed to load customers: ' + error.message, 'danger');
    }
}

function renderCustomers(customersToRender) {
    const tbody = document.getElementById('customersTableBody');

    if (customersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No customers found</td></tr>';
        return;
    }

    tbody.innerHTML = clientsToRender.map(client => `
                <tr class="fade-in">
                    <td>${client.client_id}</td>
                    <td>${client.name}</td>
                    <td>${client.email || 'N/A'}</td>
                    <td>${client.phone || 'N/A'}</td>
                    <td>${client.city || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editCustomer(${client.client_id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${client.client_id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
}

function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();

    let filtered = clients.filter(client => {
        const matchesSearch =
            client.name.toLowerCase().includes(searchTerm) ||
            (client.email && client.email.toLowerCase().includes(searchTerm)) ||
            (client.phone && client.phone.includes(searchTerm));
        return matchesSearch && matchesStatus;
    });

    renderCustomers(filtered);
}

function openCustomerModal(customer = null) {
    const modal = new bootstrap.Modal(document.getElementById('customerModal'));
    const form = document.getElementById('customerForm');

    // Reset form
    form.reset();
    document.getElementById('customerId').value = '';

    if (customer) {
        // Edit mode
        document.getElementById('customerModalTitle').textContent = 'Edit Customer';
        document.getElementById('customerId').value = customer.customer_id;
        document.getElementById('customerName').value = customer.customer_name;
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerCity').value = customer.city || '';
        document.getElementById('customerAddress').value = customer.address || '';
        document.getElementById('registrationDate').value = customer.registration_date;
        document.getElementById('customerStatus').value = customer.status;
        document.getElementById('statusGroup').style.display = 'block';
    } else {
        // Add mode
        document.getElementById('customerModalTitle').textContent = 'Add New Customer';
        document.getElementById('registrationDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('statusGroup').style.display = 'none';
    }

    modal.show();
}

async function editCustomer(customerId) {
    const customer = customers.find(c => c.customer_id === customerId);
    if (customer) {
        openCustomerModal(customer);
    }
}

async function saveCustomer() {
    const customerId = document.getElementById('customerId').value;
    const customerData = {
        customer_name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        city: document.getElementById('customerCity').value,
        address: document.getElementById('customerAddress').value,
        registration_date: document.getElementById('registrationDate').value,
        status: customerId ? document.getElementById('customerStatus').value : 'active'
    };

    // Basic validation
    if (!customerData.customer_name || !customerData.registration_date) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }

    try {
        let response;
        if (customerId) {
            // Update
            response = await apiCall(`/customers/${customerId}`, {
                method: 'PUT',
                body: JSON.stringify(customerData)
            });
        } else {
            // Create
            response = await apiCall('/customers', {
                method: 'POST',
                body: JSON.stringify(customerData)
            });
        }

        if (response.success) {
            showAlert(customerId ? 'Customer updated successfully' : 'Customer created successfully');
            bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
            loadCustomers();
            loadStats();
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        showAlert('Failed to save customer: ' + error.message, 'danger');
    }
}

async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all associated invoices and transactions.')) {
        return;
    }

    try {
        const response = await apiCall(`/customers/${customerId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showAlert('Customer deleted successfully');
            loadCustomers();
            loadStats();
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        showAlert('Failed to delete customer: ' + error.message, 'danger');
    }
}

// Stats functions
async function loadStats() {
    try {
        // Load customer payments for stats
        const paymentsResponse = await apiCall('/reports/customer-payments');
        const pendingResponse = await apiCall('/reports/pending-invoices');
        const transactionsResponse = await apiCall('/reports/transactions-by-platform');

        if (paymentsResponse.success) {
            const totalCustomers = paymentsResponse.data.length;
            const totalRevenue = paymentsResponse.data.reduce((sum, customer) => sum + parseFloat(customer.total_paid || 0), 0);

            document.getElementById('totalCustomers').textContent = totalCustomers;
            document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        }

        if (pendingResponse.success) {
            document.getElementById('pendingInvoices').textContent = pendingResponse.data.length;
        }

        if (transactionsResponse.success) {
            const today = new Date().toISOString().split('T')[0];
            const todayTransactions = transactionsResponse.data.filter(t =>
                t.transaction_date && t.transaction_date.startsWith(today)
            ).length;
            document.getElementById('todayTransactions').textContent = todayTransactions;
        }

    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Reports functions
async function loadReports() {
    await loadCustomerPayments();
    await loadPendingInvoices();
    await loadTransactionsByPlatform();
}

async function loadCustomerPayments() {
    try {
        const response = await apiCall('/reports/customer-payments');
        if (response.success) {
            renderCustomerPayments(response.data);
        }
    } catch (error) {
        showAlert('Failed to load customer payments: ' + error.message, 'danger');
    }
}

function renderCustomerPayments(payments) {
    const tbody = document.getElementById('customerPaymentsBody');

    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No payment data found</td></tr>';
        return;
    }

    tbody.innerHTML = payments.map(payment => `
                <tr>
                    <td>${payment.customer_name}</td>
                    <td>${payment.email || 'N/A'}</td>
                    <td>${formatCurrency(payment.total_paid)}</td>
                    <td>${payment.total_invoices}</td>
                </tr>
            `).join('');
}

async function loadPendingInvoices() {
    try {
        const response = await apiCall('/reports/pending-invoices');
        if (response.success) {
            renderPendingInvoices(response.data);
        }
    } catch (error) {
        showAlert('Failed to load pending invoices: ' + error.message, 'danger');
    }
}

function renderPendingInvoices(invoices) {
    const tbody = document.getElementById('pendingInvoicesBody');

    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No pending invoices found</td></tr>';
        return;
    }

    tbody.innerHTML = invoices.map(invoice => `
                <tr>
                    <td>${invoice.invoice_number}</td>
                    <td>${invoice.customer_name}</td>
                    <td>${formatCurrency(invoice.total_amount)}</td>
                    <td>${formatCurrency(invoice.paid_amount)}</td>
                    <td>${formatCurrency(invoice.pending_amount)}</td>
                    <td>${formatDate(invoice.due_date)}</td>
                </tr>
            `).join('');
}

async function loadTransactionsByPlatform() {
    try {
        const platform = document.getElementById('platformFilter').value;
        const endpoint = platform
            ? `/reports/transactions-by-platform?platform=${platform}`
            : '/reports/transactions-by-platform';

        const response = await apiCall(endpoint);
        if (response.success) {
            renderTransactionsByPlatform(response.data);
        }
    } catch (error) {
        showAlert('Failed to load transactions: ' + error.message, 'danger');
    }
}

function renderTransactionsByPlatform(transactions) {
    const tbody = document.getElementById('transactionsByPlatformBody');

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No transactions found</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(transaction => `
                <tr>
                    <td>${transaction.transaction_reference}</td>
                    <td><span class="badge bg-primary">${transaction.platform_name}</span></td>
                    <td>${transaction.customer_name}</td>
                    <td>${transaction.invoice_number}</td>
                    <td>${formatCurrency(transaction.amount)}</td>
                    <td>${formatDate(transaction.transaction_date)}</td>
                    <td>
                        <span class="status-badge status-${transaction.transaction_status}">
                            ${transaction.transaction_status.charAt(0).toUpperCase() + transaction.transaction_status.slice(1)}
                        </span>
                    </td>
                </tr>
            `).join('');
}

// CSV Upload function
async function uploadCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select a CSV file to upload', 'warning');
        return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
        showAlert('Please select a valid CSV file', 'danger');
        return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);

    const progressDiv = document.getElementById('uploadProgress');
    progressDiv.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/bulk-load`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showAlert(`CSV upload successful! ${result.processed} records processed. ${result.errors} errors found.`, 'success');
            loadCustomers();
            loadStats();
            loadReports();
            fileInput.value = '';
        } else {
            throw new Error(result.error || 'Upload failed');
        }

    } catch (error) {
        showAlert('Failed to upload CSV: ' + error.message, 'danger');
    } finally {
        progressDiv.style.display = 'none';
    }
}