// Global variables
let customers = [];
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    loadCustomers();
    loadStats();
    loadReports();

    // Add event listeners
    document.getElementById('customerSearch').addEventListener('input', filterCustomers);
    document.getElementById('statusFilter').addEventListener('change', filterCustomers);
    document.getElementById('platformFilter').addEventListener('change', loadTransactionsByPlatform)
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
                    <td>${client.email || 'N/A'}</td>
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
        return matchesSearch;
    });
    renderCustomers(filtered);
}

function openCustomerModal(client = null) {
    const modal = new bootstrap.Modal(document.getElementById('customerModal'));
    const form = document.getElementById('customerForm');

    // Reset form
    form.reset();
    document.getElementById('customerId').value = '';

    if (client) {
        // Edit mode
        document.getElementById('customerModalTitle').textContent = 'Edit Customer';
        document.getElementById('customerId').value = client.client_id;
        document.getElementById('customerName').value = client.name;
        document.getElementById('customerEmail').value = client.email || '';
        document.getElementById('customerPhone').value = client.phone || '';
        document.getElementById('customerCity').value = client.city || '';
        document.getElementById('customerAddress').value = client.address || '';
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