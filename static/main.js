// Global variables
let currentListId = null;
const catalogModal = document.getElementById('catalogModal');
const catalogSearch = document.getElementById('catalogSearch');
const burgerMenu = document.getElementById('burgerMenu');
const menuOverlay = document.getElementById('menuOverlay');
const menuClose = document.getElementById('menuClose');

// localStorage helper functions for individual lists
function getListData(listId) {
    const data = localStorage.getItem(`groceryList_${listId}`);
    return data ? JSON.parse(data) : null;
}

function setListData(listId, data) {
    localStorage.setItem(`groceryList_${listId}`, JSON.stringify(data));
}

function clearListData(listId) {
    localStorage.removeItem(`groceryList_${listId}`);
}

// Find list by ID
function findListById(listId) {
    return getListData(listId);
}

// Update list in localStorage
function updateList(listId, updatedData) {
    if (updatedData.list_id !== listId) {
        console.error('List ID mismatch:', listId, updatedData.list_id);
        return;
    }
    setListData(listId, updatedData);
}

// Save item to localStorage
function saveItemToStorage(listId, itemName, qty = 1, itemId = null) {
    let list = getListData(listId);
    
    if (!list) {
        list = {
            list_id: listId,
            items: []
        };
    }
    
    // Ensure items array exists
    if (!list.items) {
        list.items = [];
    }
    
    // Parse itemId to integer if it's a valid number, otherwise null
    let parsedItemId = null;
    if (itemId !== null && itemId !== undefined && itemId !== '' && itemId !== 'null') {
        const parsed = parseInt(itemId);
        if (!isNaN(parsed)) {
            parsedItemId = parsed;
        }
    }
    
    // Check if item already exists
    const existingItemIndex = list.items.findIndex(item => 
        (parsedItemId !== null && item.id === parsedItemId) || 
        (parsedItemId === null && item.name === itemName)
    );
    
    if (existingItemIndex !== -1) {
        // Update existing item
        list.items[existingItemIndex].qty = qty;
    } else {
        // Add new item
        list.items.push({
            id: parsedItemId,
            name: itemName,
            qty: qty
        });
    }
    
    setListData(listId, list);
}

// Remove item from localStorage
function removeItemFromStorage(listId, itemName, itemId = null) {
    let list = getListData(listId);
    if (!list || !list.items) return;
    
    // Parse itemId to integer if it's a valid number, otherwise null
    let parsedItemId = null;
    if (itemId !== null && itemId !== undefined && itemId !== '' && itemId !== 'null') {
        const parsed = parseInt(itemId);
        if (!isNaN(parsed)) {
            parsedItemId = parsed;
        }
    }
    
    list.items = list.items.filter(item => {
        if (parsedItemId !== null) {
            return item.id !== parsedItemId;
        } else {
            return item.name !== itemName;
        }
    });
    
    setListData(listId, list);
}

// List Management
function toggleList(header) {
    const listCard = header.closest('.list-card');
    listCard.classList.toggle('expanded');
}

function addItem(button) {
    const listCard = button.closest('.list-card');
    const input = listCard.querySelector('.item-input');
    const itemName = input.value.trim();
    
    if (!itemName) return;
    
    const listId = listCard.querySelector('.list-id').value;
    addItemToDOM(listId, itemName, 1);
    saveItemToStorage(listId, itemName, 1);
    markListAsUnsaved(listId);
    
    input.value = '';
}

function addItemToDOM(listId, itemName, qty = 1, itemId = null) {
    const listCards = document.querySelectorAll('.list-card');
    let targetListCard = null;
    
    // Find the correct list card
    listCards.forEach(card => {
        const cardListId = card.querySelector('.list-id').value;
        if (cardListId === listId) {
            targetListCard = card;
        }
    });
    
    if (!targetListCard) {
        console.error('List card not found for ID:', listId);
        return;
    }
    
    const listItems = targetListCard.querySelector('.list-items');
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'list-item';
    if (itemId) {
        itemDiv.setAttribute('data-item-id', itemId);
    }
    
    itemDiv.innerHTML = `
        <div class="item-info">
            <span class="item-name">${itemName}</span>
            <div class="item-details">
                <span class="qty">Qty: <input type="number" value="${qty}" min="1" class="qty-input" onchange="updateItemQty(this, '${itemId}', '${itemName}')"></span>
            </div>
        </div>
        <button class="remove-item-btn" onclick="removeItem(this)">
            <span>🗑️</span>
        </button>
    `;
    
    listItems.appendChild(itemDiv);
}

function removeItem(button) {
    const listItem = button.closest('.list-item');
    const listCard = button.closest('.list-card');
    const listId = listCard.querySelector('.list-id').value;
    const itemName = listItem.querySelector('.item-name').textContent;
    const itemId = listItem.getAttribute('data-item-id');
    
    removeItemFromStorage(listId, itemName, itemId);
    markListAsUnsaved(listId);
    listItem.remove();
}

function updateItemQty(input, itemId, itemName) {
    const listCard = input.closest('.list-card');
    const listId = listCard.querySelector('.list-id').value;
    const qty = parseInt(input.value) || 1;
    
    saveItemToStorage(listId, itemName, qty, itemId);
    markListAsUnsaved(listId);
}

// Catalog functionality
function openCatalogForList(button) {
    const listCard = button.closest('.list-card');
    currentListId = listCard.querySelector('.list-id').value;
    catalogModal.classList.add('active');
}

function openCatalogFromMenu() {
    // If no list is expanded, expand the first one
    const expandedList = document.querySelector('.list-card.expanded');
    if (!expandedList) {
        const firstList = document.querySelector('.list-card');
        if (firstList) {
            firstList.classList.add('expanded');
            currentListId = firstList.querySelector('.list-id').value;
        }
    } else {
        currentListId = expandedList.querySelector('.list-id').value;
    }
    
    catalogModal.classList.add('active');
}

function closeCatalog() {
    catalogModal.classList.remove('active');
    currentListId = null;
    
    // Reset search
    catalogSearch.value = '';
    const catalogItems = document.querySelectorAll('.catalog-item');
    catalogItems.forEach(item => item.style.display = 'block');
    document.querySelectorAll('.category-section').forEach(section => {
        section.style.display = 'block';
        section.classList.remove('expanded');
    });
}

function toggleCategory(header) {
    const categorySection = header.closest('.category-section');
    categorySection.classList.toggle('expanded');
}

function selectCatalogItem(itemName) {
    if (!currentListId) {
        console.error('No list selected');
        return;
    }
    
    addItemToDOM(currentListId, itemName, 1);
    saveItemToStorage(currentListId, itemName, 1);
    markListAsUnsaved(currentListId);
    closeCatalog();
    
    // Visual feedback
    const selectedItem = event.target;
    const originalText = selectedItem.textContent;
    selectedItem.style.backgroundColor = '#40E0D0';
    selectedItem.style.color = '#121212';
    selectedItem.textContent = '✓ Added';
    
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

// Close menu when clicking overlay
menuOverlay.addEventListener('click', (e) => {
    if (e.target === menuOverlay) {
        closeMenu();
    }
});

// Catalog button in menu
document.getElementById('catalogBtn').addEventListener('click', () => {
    closeMenu();
    openCatalogFromMenu();
});

// Logout button in menu
document.getElementById('logoutBtn').addEventListener('click', () => {
    closeMenu();
    logout();
});

function closeMenu() {
    burgerMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}

// Save List Functionality
function saveList(listId) {
    const list = findListById(listId);
    if (!list) {
        console.error('List not found:', listId);
        return;
    }
    
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
    
    // Make actual API call to backend
    console.log(`Saving list ${listId} with data:`, list);
    
    fetch(`/api/lists/${listId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(serverResponse => {
        // Transform server response (UserList array) into our expected format
        console.log('Received updated list from server:', serverResponse);
        
        // Server returns array of UserList items, transform to our format
        const transformedList = {
            list_id: listId,
            items: serverResponse.map(item => ({
                id: item.ItemID,
                name: item.Name,
                qty: item.Qty
            }))
        };
        
        console.log('Transformed list for localStorage:', transformedList);
        
        // Clear current localStorage for this list and update with server response
        clearListData(listId);
        updateList(listId, transformedList);
        
        // Update button state to saved
        saveButton.textContent = '💾 Saved';
        saveButton.classList.remove('saving');
        saveButton.classList.add('saved');
        
        setTimeout(() => {
            saveButton.textContent = '💾 Save List';
            saveButton.classList.remove('saved');
        }, 2000);
    })
    .catch(error => {
        console.error('Error saving list:', error);
        
        // Update button state to show error
        saveButton.textContent = '💾 Save Failed';
        saveButton.classList.remove('saving');
        saveButton.style.backgroundColor = '#ef4444';
        
        setTimeout(() => {
            saveButton.textContent = '💾 Save List';
            saveButton.style.backgroundColor = '#fbbf24';
        }, 3000);
    });
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

// Logout functionality
function logout() {
    window.location.replace("/logout")
}

// Create New List functionality
function createNewList() {
    const createListModal = document.getElementById('createListModal');
    createListModal.classList.add('active');
}

function closeCreateListModal() {
    const createListModal = document.getElementById('createListModal');
    createListModal.classList.remove('active');
    
    // Reset form
    document.getElementById('listNameInput').value = '';
    document.getElementById('listFrequencySelect').value = '';
    document.getElementById('listTargetDateInput').value = '';
}

function submitNewList() {
    const listName = document.getElementById('listNameInput').value.trim();
    const frequency = document.getElementById('listFrequencySelect').value;
    const targetDate = document.getElementById('listTargetDateInput').value;
    
    // Validate required fields
    if (!listName) {
        alert('List name is required');
        return;
    }
    
    const submitButton = document.getElementById('submitNewListBtn');
    submitButton.textContent = 'Creating...';
    submitButton.disabled = true;
    
    // Prepare payload
    const newListData = {
        name: listName,
        frequency: frequency || null,
        target_date: targetDate || null
    };
    
    // Make API call to create new list
    fetch('/api/lists/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newListData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(newList => {
        console.log('New list created:', newList);
        
        // Close modal
        closeCreateListModal();
        
        // Reload page to show the new list
        // Alternative: dynamically add the new list to the DOM
        window.location.reload();
    })
    .catch(error => {
        console.error('Error creating new list:', error);
        alert('Failed to create new list. Please try again.');
    })
    .finally(() => {
        submitButton.textContent = 'Create List';
        submitButton.disabled = false;
    });
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    // Close modals with Escape key
    if (e.key === 'Escape') {
        if (catalogModal.classList.contains('active')) {
            closeCatalog();
        } else if (document.getElementById('createListModal').classList.contains('active')) {
            closeCreateListModal();
        } else if (menuOverlay.classList.contains('active')) {
            closeMenu();
        }
    }
});

// Load saved items from localStorage with new structure
function loadSavedItems() {
    const listCards = document.querySelectorAll('.list-card');
    
    listCards.forEach(card => {
        const listId = card.querySelector('.list-id').value;
        
        // Skip if listId is empty or invalid
        if (!listId || listId === '') {
            return;
        }
        
        const list = getListData(listId);
        if (list && list.items) {
            list.items.forEach(item => {
                // Only add items that aren't already in the DOM (to avoid duplicates)
                const existingItems = card.querySelectorAll('.item-name');
                let itemExists = false;
                
                for (let existingItem of existingItems) {
                    if (existingItem.textContent === item.name) {
                        itemExists = true;
                        break;
                    }
                }
                
                if (!itemExists) {
                    addItemToDOM(listId, item.name, item.qty || 1, item.id);
                }
            });
            
            // Mark list as having unsaved changes if it has items
            if (list.items.length > 0) {
                markListAsUnsaved(listId);
            }
        }
    });
}

// Initialize existing items from template into localStorage
function initializeExistingItems() {
    const listCards = document.querySelectorAll('.list-card');
    
    listCards.forEach(card => {
        const listId = card.querySelector('.list-id').value;
        
        // Skip if listId is empty or invalid
        if (!listId || listId === '') {
            return;
        }
        
        const existingItems = card.querySelectorAll('.list-item[data-item-id]');
        
        if (existingItems.length > 0) {
            let list = findListById(listId);
            if (!list) {
                list = {
                    list_id: listId,
                    items: []
                };
            }
            
            // Ensure items array exists
            if (!list.items) {
                list.items = [];
            }
            
            existingItems.forEach(itemElement => {
                const itemId = itemElement.getAttribute('data-item-id');
                const itemName = itemElement.querySelector('.item-name').textContent;
                const qtyInput = itemElement.querySelector('.qty-input');
                const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
                
                // Skip if itemName is empty
                if (!itemName || itemName.trim() === '') {
                    return;
                }
                
                // Parse itemId to integer if it's a valid string number, otherwise null
                let parsedItemId = null;
                if (itemId && itemId !== 'null' && itemId !== '') {
                    const parsed = parseInt(itemId);
                    if (!isNaN(parsed)) {
                        parsedItemId = parsed;
                    }
                }
                
                // Only add to localStorage if it's not already there
                const existingItem = list.items.find(item => 
                    item.id === parsedItemId || item.name === itemName
                );
                
                if (!existingItem) {
                    list.items.push({
                        id: parsedItemId,
                        name: itemName,
                        qty: qty
                    });
                }
            });
            
            updateList(listId, list);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Auto-expand first list if exists
    const firstList = document.querySelector('.list-card');
    if (firstList) {
        firstList.classList.add('expanded');
    }
    
    // Initialize existing items first, then load any saved items
    initializeExistingItems();
    loadSavedItems();
});