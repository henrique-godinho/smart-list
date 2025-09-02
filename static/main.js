// Global variables
let currentTargetListId = null;
const catalogModal = document.getElementById('catalogModal');
const catalogSearch = document.getElementById('catalogSearch');
const burgerMenu = document.getElementById('burgerMenu');
const menuOverlay = document.getElementById('menuOverlay');
const menuClose = document.getElementById('menuClose');

// Toggle List Expansion
function toggleList(header) {
    const listCard = header.closest('.list-card');
    listCard.classList.toggle('expanded');
}

// Add Item to List
function addItem(button) {
    const addItemSection = button.closest('.add-item-section');
    const listCard = addItemSection.closest('.list-card');
    const listId = listCard.querySelector('.list-id').value;
    const input = addItemSection.querySelector('.item-input');
    const itemName = input.value.trim();
    
    if (!itemName) {
        alert('Please enter an item name');
        return;
    }
    
    // Add to DOM
    addItemToDOM(listId, itemName);
    
    // Save to localStorage
    saveItemToStorage(listId, itemName);
    
    // Clear input
    input.value = '';
    
    // Mark list as unsaved
    markListAsUnsaved(listId);
}

// Add Item to DOM
function addItemToDOM(listId, itemName) {
    // Find the correct list by ListID
    const listCards = document.querySelectorAll('.list-card');
    let targetListItems = null;
    
    listCards.forEach(card => {
        const cardListId = card.querySelector('.list-id').value;
        if (cardListId === listId) {
            targetListItems = card.querySelector('.list-items');
        }
    });
    
    if (!targetListItems) {
        console.error('Could not find list with ID:', listId);
        return;
    }
    
    // Check if item already exists
    const existingItems = targetListItems.querySelectorAll('.item-name');
    for (let item of existingItems) {
        if (item.textContent === itemName) {
            alert('Item already exists in this list');
            return;
        }
    }
    
    // Create new item element
    const itemDiv = document.createElement('div');
    itemDiv.className = 'list-item';
    itemDiv.innerHTML = `
        <div class="item-info">
            <span class="item-name">${itemName}</span>
            <div class="item-details">
                <span class="qty">Qty: <input type="number" value="1" min="1" class="qty-input" onchange="updateItemQty(this, '${listId}', '${itemName}')"></span>
            </div>
        </div>
        <button class="remove-item-btn" onclick="removeItem(this)">
            <span>🗑️</span>
        </button>
    `;
    
    // Add to list
    targetListItems.appendChild(itemDiv);
}

// Update item quantity
function updateItemQty(input, listId, itemName) {
    const newQty = parseInt(input.value) || 1;
    
    // Update localStorage
    const savedLists = JSON.parse(localStorage.getItem('groceryLists') || '{}');
    if (!savedLists[listId]) savedLists[listId] = [];
    
    const itemIndex = savedLists[listId].findIndex(item => item.name === itemName);
    if (itemIndex !== -1) {
        savedLists[listId][itemIndex].qty = newQty;
        localStorage.setItem('groceryLists', JSON.stringify(savedLists));
        
        // Mark list as unsaved
        markListAsUnsaved(listId);
    }
}

// Save Item to localStorage
function saveItemToStorage(listId, itemName, qty = 1) {
    const savedLists = JSON.parse(localStorage.getItem('groceryLists') || '{}');
    
    if (!savedLists[listId]) {
        savedLists[listId] = [];
    }
    
    // Check if item already exists
    const existingItem = savedLists[listId].find(item => item.name === itemName);
    if (existingItem) {
        return; // Don't add duplicates
    }
    
    savedLists[listId].push({
        name: itemName,
        qty: qty,
        addedAt: new Date().toISOString()
    });
    
    localStorage.setItem('groceryLists', JSON.stringify(savedLists));
}

// Remove Item
function removeItem(button) {
    const listItem = button.closest('.list-item');
    const listCard = button.closest('.list-card');
    const listId = listCard.querySelector('.list-id').value;
    const itemName = listItem.querySelector('.item-name').textContent;
    
    // Remove from DOM
    listItem.remove();
    
    // Remove from localStorage
    const savedLists = JSON.parse(localStorage.getItem('groceryLists') || '{}');
    if (savedLists[listId]) {
        savedLists[listId] = savedLists[listId].filter(item => item.name !== itemName);
        localStorage.setItem('groceryLists', JSON.stringify(savedLists));
    }
    
    // Mark list as unsaved
    markListAsUnsaved(listId);
}

// Create New List
function createNewList() {
    const listName = prompt('Enter list name:');
    if (!listName) return;
    
    // TODO: Send to backend to create new list
    console.log('Creating new list:', listName);
    
    // For now, just reload the page (in real app, you'd update the DOM)
    alert('List creation will be implemented with backend integration');
}

// Catalog functionality
function openCatalogForList(button) {
    const listCard = button.closest('.list-card');
    const listId = listCard.querySelector('.list-id').value;
    currentTargetListId = listId;
    openCatalog();
}

function openCatalogFromMenu() {
    // Find the first expanded list, or default to the first list
    const expandedList = document.querySelector('.list-card.expanded');
    const firstList = document.querySelector('.list-card');
    
    if (expandedList) {
        currentTargetListId = expandedList.querySelector('.list-id').value;
    } else if (firstList) {
        currentTargetListId = firstList.querySelector('.list-id').value;
        // Expand the first list for better UX
        firstList.classList.add('expanded');
    } else {
        alert('Please create a list first');
        return;
    }
    
    openCatalog();
}

function openCatalog() {
    catalogModal.classList.add('active');
    
    // Reset search
    catalogSearch.value = '';
    
    // Reset all categories to collapsed state
    document.querySelectorAll('.category-section').forEach(section => {
        section.classList.remove('expanded');
        section.style.display = 'block';
    });
    
    // Reset all catalog items to be visible
    document.querySelectorAll('.catalog-item').forEach(item => {
        item.style.display = 'block';
    });
}

function closeCatalog() {
    catalogModal.classList.remove('active');
    currentTargetListId = null;
    
    // Reset search
    catalogSearch.value = '';
    
    // Reset all categories to collapsed state
    document.querySelectorAll('.category-section').forEach(section => {
        section.classList.remove('expanded');
        section.style.display = 'block';
    });
    
    // Reset all catalog items to be visible
    document.querySelectorAll('.catalog-item').forEach(item => {
        item.style.display = 'block';
    });
}

// Close catalog when clicking overlay
catalogModal.addEventListener('click', (e) => {
    if (e.target === catalogModal) {
        closeCatalog();
    }
});

// Category Toggle
function toggleCategory(header) {
    const categorySection = header.closest('.category-section');
    categorySection.classList.toggle('expanded');
}

// Catalog Item Selection
function selectCatalogItem(itemName) {
    if (currentTargetListId) {
        // Add item to specific list
        addItemToDOM(currentTargetListId, itemName);
        saveItemToStorage(currentTargetListId, itemName);
        
        // Mark list as unsaved
        markListAsUnsaved(currentTargetListId);
    } else {
        // Handle adding to general list or show list selection
        console.log(`Selected "${itemName}" from catalog`);
    }
    
    // Visual feedback
    const selectedItem = event.target;
    const originalText = selectedItem.textContent;
    selectedItem.style.backgroundColor = '#4ade80';
    selectedItem.style.color = '#121212';
    selectedItem.textContent = 'Added!';
    
    setTimeout(() => {
        selectedItem.style.backgroundColor = '#333';
        selectedItem.style.color = '#40E0D0';
        selectedItem.textContent = originalText;
    }, 1000);
}

// Catalog Search Functionality
catalogSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const catalogItems = document.querySelectorAll('.catalog-item');
    
    // If search is empty, reset everything
    if (!searchTerm) {
        catalogItems.forEach(item => {
            item.style.display = 'block';
        });
        document.querySelectorAll('.category-section').forEach(section => {
            section.style.display = 'block';
            section.classList.remove('expanded');
        });
        return;
    }
    
    catalogItems.forEach(item => {
        const itemName = item.textContent.toLowerCase();
        const categorySection = item.closest('.category-section');
        
        if (itemName.includes(searchTerm)) {
            item.style.display = 'block';
            // Expand category if item matches
            categorySection.classList.add('expanded');
        } else {
            item.style.display = 'none';
        }
    });
    
    // Hide categories with no visible items
    document.querySelectorAll('.category-section').forEach(section => {
        const visibleItems = section.querySelectorAll('.catalog-item[style*="display: block"], .catalog-item:not([style*="display: none"])');
        if (visibleItems.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
        }
    });
});

// Menu functionality
burgerMenu.addEventListener('click', () => {
    burgerMenu.classList.toggle('active');
    menuOverlay.classList.add('active');
});

menuClose.addEventListener('click', closeMenu);

// Catalog button in menu
document.getElementById('catalogBtn').addEventListener('click', () => {
    closeMenu();
    openCatalogFromMenu();
});

function closeMenu() {
    burgerMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

// Save List Functionality
function saveList(listId) {
    const savedLists = JSON.parse(localStorage.getItem('groceryLists') || '{}');
    const listData = savedLists[listId] || [];
    
    // Find the save button for this list
    const listCards = document.querySelectorAll('.list-card');
    let saveButton = null;
    
    listCards.forEach(card => {
        const cardListId = card.querySelector('.list-id').value;
        if (cardListId === listId) {
            saveButton = card.querySelector('.save-list-btn');
        }
    });
    
    if (!saveButton) return;
    
    // Update button state to saving
    saveButton.textContent = '💾 Saving...';
    saveButton.classList.add('saving');
    
    // Simulate API call to backend
    console.log(`Saving list ${listId} with data:`, listData);
    
    // TODO: Replace this with actual API call
    // fetch(`/api/lists/${listId}/items`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ items: listData })
    // })
    
    setTimeout(() => {
        // Update button state to saved
        saveButton.textContent = '💾 Saved';
        saveButton.classList.remove('saving');
        saveButton.classList.add('saved');
        
        setTimeout(() => {
            saveButton.textContent = '💾 Save List';
            saveButton.classList.remove('saved');
        }, 2000);
    }, 1000);
}

function saveListFromButton(button) {
    const listCard = button.closest('.list-card');
    const listId = listCard.querySelector('.list-id').value;
    saveList(listId);
}

function markListAsUnsaved(listId) {
    const listCards = document.querySelectorAll('.list-card');
    
    listCards.forEach(card => {
        const cardListId = card.querySelector('.list-id').value;
        if (cardListId === listId) {
            const saveButton = card.querySelector('.save-list-btn');
            if (saveButton && !saveButton.classList.contains('saving')) {
                saveButton.style.backgroundColor = '#fbbf24';
                saveButton.textContent = '💾 Save Changes';
            }
        }
    });
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    // Close modals with Escape key
    if (e.key === 'Escape') {
        if (catalogModal.classList.contains('active')) {
            closeCatalog();
        } else if (menuOverlay.classList.contains('active')) {
            closeMenu();
        }
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Auto-expand first list if exists
    const firstList = document.querySelector('.list-card');
    if (firstList) {
        firstList.classList.add('expanded');
    }
    
    // Load saved items from localStorage on page load
    loadSavedItems();
});

// Load saved items from localStorage
function loadSavedItems() {
    const savedLists = JSON.parse(localStorage.getItem('groceryLists') || '{}');
    
    Object.keys(savedLists).forEach(listId => {
        savedLists[listId].forEach(item => {
            addItemToDOM(listId, item.name, item.qty || 1);
        });
        
        // Mark list as having unsaved changes if it has items
        if (savedLists[listId].length > 0) {
            markListAsUnsaved(listId);
        }
    });
}