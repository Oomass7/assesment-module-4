// Global variables
let customers = [];
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    loadCustomers();

    // Add event listeners
    document.getElementById('customerSearch').addEventListener('input', filterCustomers);
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
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
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
        console.log('Attempting to load customers...');
        const response = await apiCall('/clients');
        console.log('API response received:', response);
        customers = response.data;
        renderCustomers(customers);
    } catch (error) {
        showAlert('Failed to load customers: ' + error.message, 'danger');
    }
}

function renderCustomers(customersToRender) {
    console.log('Rendering customers:', customersToRender);
    const tableBody = document.getElementById('customersTableBody');
    tableBody.innerHTML = '';
    if (!customersToRender || customersToRender.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron clientes.</td></tr>';
        return;
    }
    customersToRender.forEach(customer => {
        const row = `
            <tr>
                <td>${customer.client_id}</td>
                <td>${customer.name}</td>
                <td>${customer.number_document}</td>
                <td>${customer.adress}</td>
                <td>${customer.phone}</td>
                <td>${customer.email}</td>
                <td>
                    <button class="btn btn-sm btn-info me-2"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function filterCustomers(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.number_document.toLowerCase().includes(searchTerm)
    );
    renderCustomers(filteredCustomers);
}