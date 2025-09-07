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
