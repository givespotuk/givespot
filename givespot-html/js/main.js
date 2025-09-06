// Common functions for GiveSpot

// Format price to British pounds
function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(price);
}

// Format date to British format
function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

// Show loading message
function showLoading(message = 'Loading...') {
    console.log('⏳ ' + message);
    
    // Create or update loading indicator
    let loadingEl = document.getElementById('loading-indicator');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loading-indicator';
        loadingEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        document.body.appendChild(loadingEl);
    }
    loadingEl.textContent = message;
    loadingEl.style.display = 'block';
}

// Hide loading message
function hideLoading() {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    console.error('❌ Error:', message);
    hideLoading();
    
    // Create error notification
    const errorEl = document.createElement('div');
    errorEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1001;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 300px;
    `;
    errorEl.textContent = 'Error: ' + message;
    
    document.body.appendChild(errorEl);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(errorEl)) {
            document.body.removeChild(errorEl);
        }
    }, 5000);
}

// Show success message
function showSuccess(message) {
    console.log('✅ Success:', message);
    hideLoading();
    
    // Create success notification
    const successEl = document.createElement('div');
    successEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1001;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 300px;
    `;
    successEl.textContent = message;
    
    document.body.appendChild(successEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (document.body.contains(successEl)) {
            document.body.removeChild(successEl);
        }
    }, 3000);
}

// Generate item code display format
function formatItemCode(code) {
    return code || 'Unknown';
}

// Calculate distance between two coordinates (for future use)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Validate UK postcode format
function isValidPostcode(postcode) {
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number (UK format)
function isValidPhone(phone) {
    const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
    return phoneRegex.test(phone) || /^0\d{10,11}$/.test(phone.replace(/\s/g, ''));
}

// Initialize GiveSpot when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 GiveSpot main.js loaded');
    console.log('📍 Current page:', window.location.pathname);
    
    // Initialize page-specific functionality
    const path = window.location.pathname;
    if (path.includes('browse.html')) {
        console.log('📋 Browse page detected');
    } else if (path.includes('index.html') || path === '/') {
        console.log('🏠 Homepage detected');
    } else if (path.includes('charity/')) {
        console.log('🏪 Charity page detected');
    } else if (path.includes('admin/')) {
        console.log('⚙️ Admin page detected');
    }
});