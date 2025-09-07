// Charity authentication and management functions

// Get current logged-in charity
function getCurrentCharity() {
    try {
        const charityData = localStorage.getItem('givespot_charity');
        if (!charityData) {
            console.log('No charity data in localStorage');
            return null;
        }
        
        const charity = JSON.parse(charityData);
        console.log('Found charity data:', charity.name);
        
        // Check if session is still valid (24 hours)
        const loginTime = new Date(charity.loginTime || 0);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            console.log('Session expired, clearing data');
            localStorage.removeItem('givespot_charity');
            return null;
        }
        
        return charity;
    } catch (error) {
        console.error('Error getting current charity:', error);
        localStorage.removeItem('givespot_charity');
        return null;
    }
}

// Set current charity (after login)
function setCurrentCharity(charityData) {
    try {
        const charityWithTime = {
            ...charityData,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('givespot_charity', JSON.stringify(charityWithTime));
        console.log('Charity session saved:', charityWithTime.name);
        return true;
    } catch (error) {
        console.error('Error setting current charity:', error);
        return false;
    }
}

// Logout charity
function logoutCharity() {
    try {
        console.log('Logging out charity');
        localStorage.removeItem('givespot_charity');
        
        // Redirect to login page
        if (window.location.pathname.includes('/charity/')) {
            window.location.href = 'login.html';
        } else {
            window.location.href = 'charity/login.html';
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Force redirect anyway
        window.location.href = 'charity/login.html';
    }
}

// Check if charity is authenticated (without redirect)
function isCharityAuthenticated() {
    const charity = getCurrentCharity();
    return charity !== null;
}

// Require charity authentication (with redirect)
function requireCharityAuth() {
    const charity = getCurrentCharity();
    if (!charity) {
        console.log('No authentication, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }
    console.log('Charity authenticated:', charity.name);
    return charity;
}

// Login charity (simplified for demo)
async function loginCharity(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        console.log('Attempting login for:', email);

        // Query charity from database
        const { data: charity, error } = await supabase
            .from('charities')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .eq('status', 'active')
            .single();

        if (error || !charity) {
            console.error('Charity not found:', error);
            throw new Error('Invalid email or charity not approved yet');
        }

        // Simple password check (for demo - use proper hashing in production)
        const isValidPassword = (email === 'demo@charity.org' && password === 'demo123') || 
                               charity.password_hash === password ||
                               password === 'test123'; // Temporary for testing

        if (!isValidPassword) {
            throw new Error('Invalid password');
        }

        // Save charity session
        const charitySession = {
            id: charity.id,
            name: charity.name,
            email: charity.email,
            postcode: charity.postcode,
            balance: charity.balance,
            loginTime: new Date().toISOString()
        };

        if (!setCurrentCharity(charitySession)) {
            throw new Error('Failed to save login session');
        }

        console.log('Login successful for:', charity.name);
        return charity;

    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Register charity
async function registerCharity(formData) {
    try {
        console.log('Registering charity:', formData.charity_name);

        // Validate required fields
        const required = ['charity_name', 'email', 'postcode', 'contact_person'];
        for (const field of required) {
            if (!formData[field] || !formData[field].trim()) {
                throw new Error(`${field.replace('_', ' ')} is required`);
            }
        }

        // Validate email format
        if (!isValidEmail(formData.email)) {
            throw new Error('Please enter a valid email address');
        }

        // Validate UK postcode
        if (!isValidPostcode(formData.postcode)) {
            throw new Error('Please enter a valid UK postcode');
        }

        // Check if charity already exists
        const { data: existingCharity } = await supabase
            .from('charities')
            .select('id')
            .eq('email', formData.email.toLowerCase().trim())
            .single();

        if (existingCharity) {
            throw new Error('A charity with this email address already exists');
        }

        // Insert charity application
        const { data: charity, error } = await supabase
            .from('charities')
            .insert({
                name: formData.charity_name.trim(),
                email: formData.email.toLowerCase().trim(),
                registration_number: formData.registration_number?.trim() || null,
                postcode: formData.postcode.toUpperCase().trim(),
                address: formData.address?.trim() || null,
                phone: formData.phone?.trim() || null,
                contact_person: formData.contact_person.trim(),
                contact_position: formData.contact_position?.trim() || null,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to submit application: ' + error.message);
        }

        console.log('Registration successful for:', charity.name);
        return charity;

    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Update charity profile
async function updateCharityProfile(charityId, updateData) {
    try {
        console.log('Updating charity profile:', charityId);

        const { data: charity, error } = await supabase
            .from('charities')
            .update(updateData)
            .eq('id', charityId)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update profile: ' + error.message);
        }

        // Update stored charity data
        setCurrentCharity(charity);

        console.log('Profile updated successfully');
        return charity;

    } catch (error) {
        console.error('Update error:', error);
        throw error;
    }
}

// Get charity statistics
async function getCharityStats(charityId) {
    try {
        console.log('Getting charity stats for:', charityId);

        // Get item counts
        const { data: items } = await supabase
            .from('items')
            .select('id, status, created_at')
            .eq('charity_id', charityId);

        const stats = {
            totalItems: items?.length || 0,
            activeItems: items?.filter(item => item.status === 'active').length || 0,
            soldItems: items?.filter(item => item.status === 'sold').length || 0,
            thisMonthItems: 0
        };

        // Calculate this month's items
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        stats.thisMonthItems = items?.filter(item => 
            new Date(item.created_at) >= thisMonth
        ).length || 0;

        console.log('Charity stats loaded:', stats);
        return stats;

    } catch (error) {
        console.error('Error getting charity stats:', error);
        return {
            totalItems: 0,
            activeItems: 0,
            soldItems: 0,
            thisMonthItems: 0
        };
    }
}

// Simple password setup (for demo purposes)
async function setupCharityPassword(charityId, password) {
    try {
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        console.log('Setting up password for charity:', charityId);

        // In production, use proper password hashing
        const { error } = await supabase
            .from('charities')
            .update({ password_hash: password })
            .eq('id', charityId);

        if (error) {
            throw new Error('Failed to set password: ' + error.message);
        }

        console.log('Password setup successful');
        return true;

    } catch (error) {
        console.error('Password setup error:', error);
        throw error;
    }
}

// Create demo charity for testing
async function createDemoCharityIfNeeded() {
    try {
        const { data: existingCharity } = await supabase
            .from('charities')
            .select('id')
            .eq('email', 'demo@charity.org')
            .single();

        if (!existingCharity) {
            console.log('Creating demo charity...');
            
            const { error } = await supabase
                .from('charities')
                .insert({
                    name: 'Demo Charity Shop',
                    email: 'demo@charity.org',
                    registration_number: 'DEMO123',
                    postcode: 'M1 1AA',
                    address: '123 Demo Street, Manchester',
                    phone: '0161 123 4567',
                    contact_person: 'Demo Manager',
                    contact_position: 'Shop Manager',
                    status: 'active',
                    balance: 10.00,
                    password_hash: 'demo123'
                });

            if (error) {
                console.error('Error creating demo charity:', error);
            } else {
                console.log('Demo charity created successfully');
            }
        } else {
            console.log('Demo charity already exists');
        }
    } catch (error) {
        console.error('Error checking/creating demo charity:', error);
    }
}

// Initialize charity functions when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Charity.js loaded successfully');
    
    // Create demo charity for testing
    if (typeof supabase !== 'undefined') {
        createDemoCharityIfNeeded();
    }
});

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    // Make functions globally available
    window.getCurrentCharity = getCurrentCharity;
    window.setCurrentCharity = setCurrentCharity;
    window.logoutCharity = logoutCharity;
    window.isCharityAuthenticated = isCharityAuthenticated;
    window.requireCharityAuth = requireCharityAuth;
    window.loginCharity = loginCharity;
    window.registerCharity = registerCharity;
    window.updateCharityProfile = updateCharityProfile;
    window.getCharityStats = getCharityStats;
    window.setupCharityPassword = setupCharityPassword;
    
    console.log('Charity functions exported to window');
}
