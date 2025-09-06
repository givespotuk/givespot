// Items functionality for GiveSpot

// Load all active items from database
async function loadItems(filters = {}) {
    try {
        showLoading('Loading charity items...');
        
        let query = supabase
            .from('items')
            .select(`
                id,
                item_code,
                price,
                image_urls,
                status,
                created_at,
                charities (
                    name,
                    postcode,
                    address
                )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        // Apply filters if provided
        if (filters.postcode) {
            query = query.ilike('charities.postcode', `${filters.postcode}%`);
        }
        
        if (filters.maxPrice) {
            query = query.lte('price', filters.maxPrice);
        }

        const { data: items, error } = await query;

        if (error) {
            throw error;
        }

        console.log(`📦 Loaded ${items?.length || 0} items`);
        displayItems(items || []);
        hideLoading();
        
        return items;
        
    } catch (err) {
        console.error('Error loading items:', err);
        showError('Failed to load items: ' + err.message);
        hideLoading();
        return [];
    }
}

// Display items on the page
function displayItems(items) {
    const container = document.getElementById('itemsContainer');
    
    if (!container) {
        console.error('Items container not found');
        return;
    }
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="no-items">
                <h3>No items available</h3>
                <p>Check back later for new charity items!</p>
            </div>
        `;
        return;
    }

    // Create items grid
    let html = `
        <div class="items-header">
            <h2>Available Items (${items.length})</h2>
        </div>
        <div class="items-grid">
    `;
    
    items.forEach(item => {
        const charity = item.charities || {};
        const hasImage = item.image_urls && item.image_urls.length > 0;
        
        html += `
            <div class="item-card" data-item-id="${item.id}">
                <div class="item-image">
                    ${hasImage 
                        ? `<img src="${item.image_urls[0]}" alt="Item ${item.item_code}" loading="lazy">`
                        : `<div class="no-image-placeholder">
                             <span>📦</span>
                             <p>No Image</p>
                           </div>`
                    }
                </div>
                <div class="item-details">
                    <div class="item-header">
                        <h3 class="item-code">${formatItemCode(item.item_code)}</h3>
                        <span class="item-price">${formatPrice(item.price)}</span>
                    </div>
                    
                    <div class="charity-info">
                        <p class="charity-name">
                            <span class="charity-icon">🏪</span>
                            ${charity.name || 'Unknown Charity'}
                        </p>
                        ${charity.postcode ? `
                            <p class="charity-location">
                                <span class="location-icon">📍</span>
                                ${charity.postcode}
                            </p>
                        ` : ''}
                    </div>
                    
                    <button onclick="reserveItem('${item.id}', '${item.item_code}')" 
                            class="reserve-btn">
                        🔖 Reserve Item
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    console.log(`✅ Displayed ${items.length} items successfully`);
}

// Reserve an item (will be implemented in Step 5)
function reserveItem(itemId, itemCode) {
    console.log('🔖 Reserve item clicked:', itemId, itemCode);
    
    // For now, show a placeholder message
    showSuccess(`Reservation for ${itemCode} will be implemented in Step 5!`);
    
    // TODO: Implement reservation form and functionality
}

// Search items by postcode
async function searchItems(postcode) {
    if (!postcode || postcode.trim() === '') {
        loadItems(); // Load all items if no postcode
        return;
    }
    
    if (!isValidPostcode(postcode)) {
        showError('Please enter a valid UK postcode (e.g. M1 1AA)');
        return;
    }
    
    console.log('🔍 Searching items near:', postcode);
    
    await loadItems({ postcode: postcode.trim() });
}

// Filter items by price range
async function filterByPrice(maxPrice) {
    console.log('💷 Filtering by max price:', maxPrice);
    
    await loadItems({ maxPrice: maxPrice });
}

// Refresh items list
async function refreshItems() {
    console.log('🔄 Refreshing items...');
    await loadItems();
}

// Initialize items functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only run on browse page
    if (window.location.pathname.includes('browse.html') || 
        document.getElementById('itemsContainer')) {
        
        console.log('📋 Initializing items page...');
        
        // Load items automatically
        loadItems();
        
        // Set up search functionality if search form exists
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const postcodeInput = document.getElementById('postcodeInput');
                if (postcodeInput) {
                    searchItems(postcodeInput.value);
                }
            });
        }
        
        // Set up postcode input if it exists
        const postcodeInput = document.getElementById('postcodeInput');
        if (postcodeInput) {
            postcodeInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchItems(this.value);
                }
            });
        }
    }
});