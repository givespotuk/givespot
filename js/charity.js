// Charity authentication and management functions

// Get current logged-in charity
function getCurrentCharity() {
    try {
        const charityData = localStorage.getItem('givespot_charity');
        if (!charityData) return null;
        
        const charity = JSON.parse(charityData);
        
        // Check if session is still valid (24 hours)
        const loginTime = new Date(charity.loginTime || 0);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            // Session expired
            logoutCharity();
            return null;
        }
        
        return charity;
    } catch (error) {
        console.error('Error getting current charity:', error);
        logoutCharity();
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
        return true;
    } catch (error) {
        console.error('Error setting current charity:', error);
        return false;
    }
}

// Logout charity
function logoutCharity() {
    try {
        localStorage.removeItem('givespot_charity');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error during logout:', error);
        // Force redirect anyway
        window.location.href = 'login.html';
    }
}

// Check if charity is authenticated
function requireCharityAuth() {
    const charity = getCurrentCharity();
    if (!charity) {
        window.location.href = 'login.html';
        return false;
    }
    return charity;
}

// Login charity
async function loginCharity(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        showLoading('Signing in...');

        // For now, simple email/password check against database
        // In production, you'd use proper password hashing
        const { data: charity, error } = await supabase
            .from('charities')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .eq('status', 'active')
            .single();

        if (error || !charity) {
            throw new Error('Invalid email or charity not found');
        }

        // For now, we'll use a simple password check
        // In production, use proper password hashing (bcrypt, etc.)
        if (!charity.password_hash) {
            throw new Error('Charity account not fully set up. Please contact admin.');
        }

        // Simple password check (replace with proper hash verification)
        if (charity.password_hash !== password) {
            throw new Error('Invalid password');
        }

        // Set current charity
        if (!setCurrentCharity(charity)) {
            throw new Error('Failed to save login session');
        }

        hideLoading();
        showSuccess('Login successful! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

        return charity;

    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showError(error.message || 'Login failed. Please try again.');
        return null;
    }
}

// Register charity
async function registerCharity(formData) {
    try {
        showLoading('Submitting application...');

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

        hideLoading();
        showSuccess('Application submitted successfully! You will receive an email when approved.');
        
        // Redirect to confirmation page or login
        setTimeout(() => {
            window.location.href = 'login.html?registered=true';
        }, 2000);

        return charity;

    } catch (error) {
        hideLoading();
        console.error('Registration error:', error);
        showError(error.message || 'Registration failed. Please try again.');
        return null;
    }
}

// Update charity profile
async function updateCharityProfile(charityId, updateData) {
    try {
        showLoading('Updating profile...');

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

        hideLoading();
        showSuccess('Profile updated successfully');
        return charity;

    } catch (error) {
        hideLoading();
        console.error('Update error:', error);
        showError(error.message || 'Failed to update profile');
        return null;
    }
}

// Get charity statistics
async function getCharityStats(charityId) {
    try {
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

        // In production, use proper password hashing
        const { error } = await supabase
            .from('charities')
            .update({ password_hash: password })
            .eq('id', charityId);

        if (error) {
            throw new Error('Failed to set password: ' + error.message);
        }

        return true;

    } catch (error) {
        console.error('Password setup error:', error);
        showError(error.message || 'Failed to set password');
        return false;
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.charityFunctions = {
        getCurrentCharity,
        setCurrentCharity,
        logoutCharity,
        requireCharityAuth,
        loginCharity,
        registerCharity,
        updateCharityProfile,
        getCharityStats,
        setupCharityPassword
    };
}
