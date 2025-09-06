// Main utility functions for GiveSpot

// Format price to British pounds
function formatPrice(price) {
    if (typeof price !== 'number') {
        price = parseFloat(price) || 0;
    }
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(price);
}

// Format date to British format
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

// Format item code for display
function formatItemCode(code) {
    if (!code) return 'Unknown';
    return code.toUpperCase();
}

// Validate email address
function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate UK postcode
function isValidPostcode(postcode) {
    if (!postcode) return false;
    // UK postcode regex (simplified)
    const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
}

// Validate UK phone number
function isValidPhone(phone) {
    if (!phone) return false;
    // UK phone number regex (simplified)
    const phoneRegex = /^(\+44\s?|0)(\d{4}\s?\d{3}\s?\d{3}|\d{3}\s?\d{3}\s?\d{4}|\d{2}\s?\d{4}\s?\d{4})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Show success message
function showSuccess(message) {
    // Remove any existing notifications
    removeNotifications();
    
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">✓</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="removeNotifications()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(removeNotifications, 5000);
}

// Show error message
function showError(message) {
    // Remove any existing notifications
    removeNotifications();
    
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">⚠</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="removeNotifications()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 7 seconds
    setTimeout(removeNotifications, 7000);
}

// Show loading message
function showLoading(message = 'Loading...') {
    // Remove any existing notifications
    removeNotifications();
    
    const notification = document.createElement('div');
    notification.className = 'notification notification-loading';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-spinner"></div>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
}

// Hide loading message
function hideLoading() {
    removeNotifications();
}

// Remove all notifications
function removeNotifications() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
        notification.remove();
    });
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Sanitize HTML to prevent XSS
function sanitizeHTML(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        // Modern approach
        navigator.clipboard.writeText(text).then(() => {
            showSuccess('Copied to clipboard');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy function
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showSuccess('Copied to clipboard');
        } else {
            showError('Failed to copy to clipboard');
        }
    } catch (err) {
        showError('Failed to copy to clipboard');
    }
    
    document.body.removeChild(textArea);
}

// Get query parameter from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Update URL parameter
function updateQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.replaceState(null, '', url);
}

// Generate random ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Calculate time ago
function timeAgo(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return formatDate(dateString);
    } catch (error) {
        return 'Unknown';
    }
}

// Track platform statistics (simple analytics)
function trackEvent(event, data = {}) {
    try {
        // Simple event tracking - can be expanded later
        console.log('Event tracked:', event, data);
        
        // Store in localStorage for basic analytics
        const events = JSON.parse(localStorage.getItem('givespot_events') || '[]');
        events.push({
            event,
            data,
            timestamp: new Date().toISOString(),
            page: window.location.pathname
        });
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('givespot_events', JSON.stringify(events));
    } catch (error) {
        console.error('Error tracking event:', error);
    }
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add notification styles if not already present
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                min-width: 300px;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success {
                background: #10b981;
                color: white;
            }
            
            .notification-error {
                background: #ef4444;
                color: white;
            }
            
            .notification-loading {
                background: #3b82f6;
                color: white;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-icon {
                font-size: 18px;
                font-weight: bold;
            }
            
            .notification-message {
                flex: 1;
                font-size: 14px;
                font-weight: 500;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            .notification-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @media (max-width: 768px) {
                .notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Track page view
    trackEvent('page_view', {
        path: window.location.pathname,
        referrer: document.referrer
    });
    
    // Add global error handling
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        // Don't show user-facing error for every JS error
    });
    
    // Add global unhandled promise rejection handling
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault();
    });
});

// Export functions for use in other scripts (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPrice,
        formatDate,
        formatItemCode,
        isValidEmail,
        isValidPostcode,
        isValidPhone,
        showSuccess,
        showError,
        showLoading,
        hideLoading,
        debounce,
        sanitizeHTML,
        copyToClipboard,
        getQueryParam,
        updateQueryParam,
        generateId,
        timeAgo,
        trackEvent
    };
}
