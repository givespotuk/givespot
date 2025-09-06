// Charity functionality for GiveSpot

// Register a new charity
async function registerCharity(charityData) {
    try {
        showLoading('Submitting charity application...');
        
        // Validate required fields
        if (!charityData.name || !charityData.email || !charityData.postcode) {
            throw new Error('Please fill in all required fields');
        }
        
        if (!isValidEmail(charityData.email)) {
            throw new Error('Please enter a valid email address');
        }
        
        if (!isValidPostcode(charityData.postcode)) {
            throw new Error('Please enter a valid UK postcode');
        }
        
        // Insert charity application
        const { data, error } = await supabase
            .from('charities')
            .insert([{
                name: charityData.name.trim(),
                email: charityData.email.trim().toLowerCase(),
                registration_number: charityData.registrationNumber?.trim() || null,
                postcode: charityData.postcode.trim().toUpperCase(),
                address: charityData.address?.trim() || null,
                phone: charityData.phone?.trim() || null,
                contact_person: charityData.contactPerson?.trim() || null,
                contact_position: charityData.contactPosition?.trim() || null,
                status: 'pending',
                balance: 0.00
            }])
            .select();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('This email is already registered. Please use a different email address.');
            }
            throw error;
        }

        console.log('Charity registered:', data[0]);
        showSuccess('Application submitted successfully! We will review and contact you within 2-3 business days.');
        
        // Clear form if it exists
        const form = document.getElementById('charityRegisterForm');
        if (form) {
            form.reset();
        }
        
        hideLoading();
        return data[0];
        
    } catch (err) {
        console.error('Registration error:', err);
        showError(err.message);
        hideLoading();
        return null;
    }
}

// Login charity (simple version for now)
async function loginCharity(email, password) {
    try {
        showLoading('Logging in...');
        
        if (!email || !password) {
            throw new Error('Please enter both email and password');
        }
        
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // For now, just check if charity exists and is active
        // TODO: Implement proper password authentication in later steps
        const { data: charity, error } = await supabase
            .from('charities')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('status', 'active')
            .single();

        if (error || !charity) {
            throw new Error('Invalid login credentials or charity not approved yet');
        }

        // Store charity session (FIXED: using correct key)
        localStorage.setItem('givespot_charity_user', JSON.stringify({
            id: charity.id,
            name: charity.name,
            email: charity.email,
            loginTime: new Date().toISOString()
        }));

        showSuccess('Login successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

        hideLoading();
        return charity;
        
    } catch (err) {
        console.error('Login error:', err);
        showError(err.message);
        hideLoading();
        return null;
    }
}

// Check if charity is logged in
function isCharityLoggedIn() {
    const session = localStorage.getItem('givespot_charity_user');
    if (!session) return false;
    
    try {
        const charity = JSON.parse(session);
        const loginTime = new Date(charity.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
        
        // Session expires after 24 hours
        if (hoursSinceLogin > 24) {
            localStorage.removeItem('givespot_charity_user');
            return false;
        }
        
        return charity;
    } catch (err) {
        localStorage.removeItem('givespot_charity_user');
        return false;
    }
}

// Get current charity session
function getCurrentCharity() {
    return isCharityLoggedIn();
}

// Logout charity
function logoutCharity() {
    localStorage.removeItem('givespot_charity_user');
    showSuccess('Logged out successfully');
    
    // Redirect to login page after short delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Load charity dashboard data
async function loadCharityDashboard() {
    try {
        const charity = getCurrentCharity();
        if (!charity) {
            window.location.href = 'login.html';
            return;
        }
        
        showLoading('Loading dashboard...');
        
        // Load charity details and items
        const [charityResult, itemsResult] = await Promise.all([
            supabase
                .from('charities')
                .select('*')
                .eq('id', charity.id)
                .single(),
            supabase
                .from('items')
                .select('*')
                .eq('charity_id', charity.id)
                .order('created_at', { ascending: false })
        ]);

        if (charityResult.error) {
            throw charityResult.error;
        }

        const charityData = charityResult.data;
        const items = itemsResult.data || [];

        // Update dashboard display
        displayCharityDashboard(charityData, items);
        hideLoading();
        
        return { charity: charityData, items };
        
    } catch (err) {
        console.error('Dashboard loading error:', err);
        showError('Failed to load dashboard: ' + err.message);
        hideLoading();
    }
}

// Display charity dashboard
function displayCharityDashboard(charity, items) {
    // Update charity info
    const charityNameEl = document.getElementById('charityName');
    if (charityNameEl) {
        charityNameEl.textContent = charity.name;
    }
    
    const balanceEl = document.getElementById('accountBalance');
    if (balanceEl) {
        balanceEl.textContent = formatPrice(charity.balance);
    }
    
    const itemCountEl = document.getElementById('itemCount');
    if (itemCountEl) {
        itemCountEl.textContent = items.length;
    }
    
    // Display items list
    const itemsListEl = document.getElementById('charityItemsList');
    if (itemsListEl && items.length > 0) {
        let html = '<div class="charity-items">';
        
        items.slice(0, 5).forEach(item => { // Show latest 5 items
            html += `
                <div class="charity-item">
                    <span class="item-code">${item.item_code}</span>
                    <span class="item-price">${formatPrice(item.price)}</span>
                    <span class="item-status status-${item.status}">${item.status}</span>
                    <span class="item-date">${formatDate(item.created_at)}</span>
                </div>
            `;
        });
        
        html += '</div>';
        itemsListEl.innerHTML = html;
    }
    
    console.log('Dashboard updated for:', charity.name);
}

// Add new item (placeholder for Step 8)
async function addNewItem(itemData) {
    try {
        const charity = getCurrentCharity();
        if (!charity) {
            throw new Error('Please log in first');
        }
        
        showLoading('Adding new item...');
        
        // Validate item data
        if (!itemData.price || itemData.price <= 0) {
            throw new Error('Please enter a valid price');
        }
        
        // TODO: Implement image upload and item creation in Step 8
        showSuccess('Item upload will be implemented in Step 8!');
        
        hideLoading();
        
    } catch (err) {
        console.error('Add item error:', err);
        showError(err.message);
        hideLoading();
    }
}

// Initialize charity functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    // Charity registration page
    if (path.includes('charity/register.html')) {
        console.log('Charity registration page loaded');
        
        const form = document.getElementById('charityRegisterForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(form);
                const charityData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    registrationNumber: formData.get('registrationNumber'),
                    postcode: formData.get('postcode'),
                    address: formData.get('address'),
                    phone: formData.get('phone'),
                    contactPerson: formData.get('contactPerson'),
                    contactPosition: formData.get('contactPosition')
                };
                
                registerCharity(charityData);
            });
        }
    }
    
    // Charity login page
    else if (path.includes('charity/login.html')) {
        console.log('Charity login page loaded');
        
        const form = document.getElementById('charityLoginForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(form);
                const email = formData.get('email');
                const password = formData.get('password');
                
                loginCharity(email, password);
            });
        }
    }
    
    // Charity dashboard page
    else if (path.includes('charity/dashboard.html')) {
        console.log('Charity dashboard page loaded');
        
        // Check if logged in
        if (!isCharityLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Load dashboard data
        loadCharityDashboard();
        
        // Set up logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutCharity);
        }
    }
});
