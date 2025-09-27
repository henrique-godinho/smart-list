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

// Store list metadata separately
function getListMetadata(listId) {
    const data = localStorage.getItem(`groceryListMeta_${listId}`);
    return data ? JSON.parse(data) : null;
}

function setListMetadata(listId, metadata) {
    localStorage.setItem(`groceryListMeta_${listId}`, JSON.stringify(metadata));
}

function clearListData(listId) {
    localStorage.removeItem(`groceryList_${listId}`);
    localStorage.removeItem(`groceryListMeta_${listId}`);
}

// Save item to localStorage
function saveItemToStorage(listId, itemName, qty, itemId = null) {
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
    
    // Check for duplicate items in the DOM
    const existingItems = listCard.querySelectorAll('.item-name');
    let duplicateFound = false;
    
    for (let existingItem of existingItems) {
        if (existingItem.textContent.toLowerCase() === itemName.toLowerCase()) {
            duplicateFound = true;
            break;
        }
    }
    
    if (duplicateFound) {
        const userChoice = confirm(
            `"${itemName}" already exists in this list.\n\n` +
            `Would you like to:\n` +
            `• Click OK to increase the quantity of the existing item\n` +
            `• Click Cancel to enter a different name`
        );
        
        if (userChoice) {
            // Find the existing item and increase its quantity
            for (let existingItem of existingItems) {
                if (existingItem.textContent.toLowerCase() === itemName.toLowerCase()) {
                    const qtyInput = existingItem.closest('.list-item').querySelector('.qty-input');
                    if (qtyInput) {
                        const currentQty = parseInt(qtyInput.value) || 1;
                        qtyInput.value = currentQty + 1;
                        
                        // Trigger the change event to update localStorage
                        const listId = listCard.querySelector('.list-id').value;
                        const itemId = existingItem.closest('.list-item').getAttribute('data-item-id');
                        updateItemQty(qtyInput, itemId, existingItem.textContent);
                        
                        // Clear input and show feedback
                        input.value = '';
                        
                        // Visual feedback on the updated item
                        const listItem = existingItem.closest('.list-item');
                        const originalBg = listItem.style.backgroundColor;
                        listItem.style.backgroundColor = '#40E0D0';
                        listItem.style.color = '#121212';
                        
                        setTimeout(() => {
                            listItem.style.backgroundColor = originalBg;
                            listItem.style.color = '';
                        }, 1000);
                        
                        return;
                    }
                    break;
                }
            }
        }
        
        // If user clicked Cancel or something went wrong, just return without adding
        return;
    }
    
    const listId = listCard.querySelector('.list-id').value;
    addItemToDOM(listId, itemName, 1);
    saveItemToStorage(listId, itemName, 1);
    markListAsUnsaved(listId);
    
    input.value = '';
}

function addItemToDOM(listId, itemName, qty = 1, itemId = null) {
    // Skip adding items with empty or invalid names
    if (!itemName || itemName.trim() === '') {
        console.warn('Skipping item with empty name for list:', listId);
        return;
    }
    
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
    // Prevent event bubbling that might close the modal
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (!currentListId) {
        console.error('No list selected');
        return;
    }
    
    addItemToDOM(currentListId, itemName, 1);
    saveItemToStorage(currentListId, itemName, 1);
    markListAsUnsaved(currentListId);
    
    // Visual feedback
    const selectedItem = event ? event.target : null;
    if (!selectedItem) {
        console.error('Could not find selected item element');
        return;
    }
    
    const originalText = selectedItem.textContent;
    const originalBackgroundColor = selectedItem.style.backgroundColor || '#333';
    const originalColor = selectedItem.style.color || '#40E0D0';
    
    selectedItem.style.backgroundColor = '#40E0D0';
    selectedItem.style.color = '#121212';
    selectedItem.textContent = '✓ Added';
    
    setTimeout(() => {
        selectedItem.style.backgroundColor = originalBackgroundColor;
        selectedItem.style.color = originalColor;
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
    const list = getListData(listId);
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
        setListData(listId, transformedList);
        
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
        target_date: targetDate ? new Date(targetDate).toISOString() : null
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
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(newList => {
        console.log('New list created:', newList);
        
        // Validate response structure
        if (!newList || !newList.id) {
            console.error('Invalid response structure:', newList);
            throw new Error('Invalid response from server');
        }
        
        // Close modal
        closeCreateListModal();
        
        // Dynamically add the new list to the DOM
        addNewListToDOM(newList);
        
        // Initialize localStorage for the new list
        const emptyList = {
            list_id: newList.id,
            items: []
        };
        setListData(newList.id, emptyList);
        
        // Store list metadata
        const metadata = {
            name: newList.name,
            target_date: newList.target_date,
            frequency: newList.frequency
        };
        setListMetadata(newList.id, metadata);
        
        console.log('New list added to DOM and localStorage');
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

// Add new list to DOM dynamically
function addNewListToDOM(listData) {
    const listsContainer = document.querySelector('.lists-container');
    
    // Format target date for display
    let targetDateDisplay = '';
    if (listData.target_date && 
        listData.target_date !== '0001-01-01T00:00:00Z' && 
        !listData.target_date.startsWith('0001-01-01')) {
        const date = new Date(listData.target_date);
        // Check if it's a valid date and not a zero date
        if (date.getFullYear() > 1) {
            targetDateDisplay = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
    }
    
    // Create new list card HTML
    const listCardHTML = `
        <div class="list-card expanded">
            <div class="list-header" onclick="toggleList(this)">
                <input type="hidden" class="list-id" value="${listData.id}">
                <h2 class="list-name">${listData.name}</h2>
                <div class="list-meta">
                    ${targetDateDisplay ? `<span class="target-date">📅 ${targetDateDisplay}</span>` : ''}
                    ${listData.frequency ? `<span class="list-freq">🔄 ${listData.frequency}</span>` : ''}
                </div>
                <button class="expand-btn">
                    <span class="expand-icon">▼</span>
                </button>
            </div>
            
            <div class="list-items">
                <!-- Items will be added here -->
            </div>
            
            <!-- Add Item Section -->
            <div class="add-item-section">
                <div class="add-item-input">
                    <input type="text" placeholder="Add new item..." class="item-input">
                    <button class="add-from-catalog-btn" onclick="openCatalogForList(this)">
                        📦
                    </button>
                </div>
                <button class="add-item-btn" onclick="addItem(this)">
                    Add Item
                </button>
                <button class="save-list-btn" onclick="saveListFromButton(this)">
                    💾 Save List
                </button>
            </div>
        </div>
    `;
    
    // Insert the new list card before the "Create New List" button
    const createListBtn = document.querySelector('.create-list-btn');
    if (createListBtn) {
        createListBtn.insertAdjacentHTML('beforebegin', listCardHTML);
        
        // Find the newly added list card (it's the element right before the create button)
        const newListCard = createListBtn.previousElementSibling;
        if (newListCard) {
            newListCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        // If no create button found, append to lists container
        listsContainer.insertAdjacentHTML('beforeend', listCardHTML);
        
        // Find the last list card
        const newListCard = listsContainer.lastElementChild;
        if (newListCard) {
            newListCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
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
                // Skip items with empty names
                if (!item.name || item.name.trim() === '') {
                    console.warn('Skipping item with empty name in localStorage for list:', listId);
                    return;
                }
                
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
    }
    )
}

// Initialize existing items from template into localStorage
function initializeExistingItems() {
    const listCards = document.querySelectorAll('.list-card');
    console.log('Found', listCards.length, 'list cards to initialize');
    listCards.forEach(card => {
        const listId = card.querySelector('.list-id').value;
        
        // Skip if listId is empty or invalid
        if (!listId || listId === '') {
            console.log('Skipping card with invalid listId:', listId);
            return;
        }
        
        // Extract list metadata from DOM
        const listNameElement = card.querySelector('.list-name');
        const targetDateElement = card.querySelector('.target-date');
        const listFreqElement = card.querySelector('.list-freq');
        
        const listName = listNameElement ? listNameElement.textContent.trim() : `List ${listId.substring(0, 8)}...`;
        
        console.log('Extracting metadata for list', listId, ':', {
            name: listName,
            frequency: listFreqElement ? listFreqElement.textContent : 'none'
        });
        
        const metadata = {
            name: listName,
            target_date: targetDateElement ? targetDateElement.textContent.replace('📅 ', '').trim() : null,
            frequency: listFreqElement ? listFreqElement.textContent.replace('🔄 ', '').trim() : null
        };
        
        setListMetadata(listId, metadata);
        
        const existingItems = card.querySelectorAll('.list-item[data-item-id]');
        
        if (existingItems.length > 0) {
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
            
            existingItems.forEach(itemElement => {
                const itemId = itemElement.getAttribute('data-item-id');
                const itemName = itemElement.querySelector('.item-name').textContent;
                const qtyInput = itemElement.querySelector('.qty-input');
                const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
                
                // Skip if itemName is empty
                if (!itemName || itemName.trim() === '') {
                    console.warn('Skipping DOM item with empty name for list:', listId);
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
            
            setListData(listId, list);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Fix zero dates in existing DOM elements
    fixZeroDatesInDOM();
    
    // Load lists from localStorage that might not be in the DOM
    loadListsFromLocalStorage();
    
    // Auto-expand first list if exists
    const firstList = document.querySelector('.list-card');
    if (firstList) {
        firstList.classList.add('expanded');
    }
    
    // Initialize existing items first, then load any saved items
    initializeExistingItems();
    loadSavedItems();
});

// Fix zero dates that are already in the DOM from server rendering
function fixZeroDatesInDOM() {
    const targetDateElements = document.querySelectorAll('.target-date');
    
    targetDateElements.forEach(element => {
        const dateText = element.textContent.replace('📅 ', '').trim();
        
        // Check if it's a zero date in various formats
        if (dateText.startsWith('0001-01-01') || 
            dateText === '0001-01-01T00:00:00Z' ||
            dateText.includes('0001-01-01 00:00:00')) {
            // Hide the entire element for zero dates
            element.style.display = 'none';
        } else {
            // For valid dates, try to format them properly
            try {
                const date = new Date(dateText);
                if (date.getFullYear() > 1) {
                    const formattedDate = date.toISOString().split('T')[0];
                    element.textContent = `📅 ${formattedDate}`;
                } else {
                    element.style.display = 'none';
                }
            } catch (error) {
                // If date parsing fails, hide the element
                element.style.display = 'none';
            }
        }
    });
}
// Load lists from localStorage that aren't in the DOM (empty lists)
function loadListsFromLocalStorage() {
    // Get all grocery list keys from localStorage
    const listKeys = Object.keys(localStorage).filter(key => key.startsWith('groceryList_'));
    
    listKeys.forEach(key => {
        const listId = key.replace('groceryList_', '');
        
        // Skip if listId is invalid
        if (!listId || listId === 'undefined' || listId === 'null') {
            return;
        }
        
        // Check if this list already exists in the DOM
        const existingList = document.querySelector(`.list-id[value="${listId}"]`);
        if (existingList) {
            return; // List already in DOM
        }
        
        // Get list data from localStorage
        const listData = getListData(listId);
        const listMetadata = getListMetadata(listId);
        
        if (!listData) {
            return;
        }
        
        // Create list object for DOM creation using stored metadata
        const mockList = {
            id: listId,
            name: listMetadata && listMetadata.name ? listMetadata.name : `List ${listId.substring(0, 8)}...`,
            frequency: listMetadata ? listMetadata.frequency : null,
            target_date: listMetadata ? listMetadata.target_date : null
        };
        
        // Add to DOM
        addNewListToDOM(mockList);
        
        // Load items if any
        if (listData.items && listData.items.length > 0) {
            listData.items.forEach(item => {
                addItemToDOM(listId, item.name, item.qty || 1, item.id);
            });
        }
    });
}