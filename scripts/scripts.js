// Export functions that need to be accessed by inline event handlers
window.selectUser = selectUser;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;

// Validation helper functions
function validateEmail(input) {
    const value = input.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    updateValidationUI(input, isValid, 'Please enter a valid email address');
    return isValid;
}

function validatePassword(input) {
    const password = input.value;
    const hasMinLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasCapital = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const isValid = hasMinLength && hasNumber && hasCapital && hasSpecial;
    
    let message = [];
    if (!hasMinLength) message.push('Password must be at least 6 characters long');
    if (!hasNumber) message.push('Include at least one number');
    if (!hasCapital) message.push('Include at least one capital letter');
    if (!hasSpecial) message.push('Include at least one special character');
    
    updateValidationUI(input, isValid, message.join('\n'));
    return isValid;
}

function updateValidationUI(input, isValid, message) {
    const container = input.closest('.input-container');
    if (!container) return isValid;

    let errorElement = container.querySelector('.error-message');
    
    // Create error element if it doesn't exist
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        container.appendChild(errorElement);
    }

    // Update classes and message
    if (!isValid) {
        input.classList.add('invalid');
        input.classList.remove('valid');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Position the tooltip
        const inputRect = input.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Check if tooltip would go off screen
        const tooltipRight = containerRect.right + 220; // 200px max-width + 20px padding
        if (tooltipRight > window.innerWidth) {
            errorElement.style.left = 'auto';
            errorElement.style.right = 'calc(100% + 10px)';
            errorElement.style.transform = 'translateY(-50%)';
            errorElement.style.setProperty('--tooltip-direction', 'left');
        } else {
            errorElement.style.left = 'calc(100% + 10px)';
            errorElement.style.right = 'auto';
            errorElement.style.transform = 'translateY(-50%)';
            errorElement.style.setProperty('--tooltip-direction', 'right');
        }
    } else {
        input.classList.add('valid');
        input.classList.remove('invalid');
        errorElement.style.display = 'none';
    }

    return isValid;
}

// Authentication functions
async function handleSignIn(email, password) {
    try {
        showLoading('Signing in...');
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log('Sign-in successful:', userCredential.user);
        window.location.href = 'dashboard.html'; // Force redirect
    } catch (error) {
        console.error('Error during sign in:', error);
        hideLoading();
        alert(error.message);
    }
}

// Form validation and submission handlers
function setupSigninValidation(form) {
    if (!form) {
        console.error('No sign-in form found');
        return;
    }

    console.log('Setting up signin validation');

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        const emailInput = form.querySelector('#email');
        const passwordInput = form.querySelector('#password');

        if (!emailInput || !passwordInput) {
            console.error('Email or password input not found');
            return;
        }

        try {
            showLoading('Signing in...');
            console.log('Attempting sign in with:', emailInput.value);
            
            const userCredential = await firebase.auth().signInWithEmailAndPassword(
                emailInput.value,
                passwordInput.value
            );
            
            console.log('Sign-in successful:', userCredential.user);
            window.location.replace('dashboard.html');
        } catch (error) {
            console.error('Error during sign in:', error);
            hideLoading();
            alert(error.message);
        }
    });
}

// Initialize signin form immediately if we're on the signin page
if (document.querySelector('.signin-form')) {
    console.log('Found signin form, initializing...');
    setupSigninValidation(document.querySelector('.signin-form'));
}

// Initialize all functionality when the module loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check if Firebase is initialized
        if (!firebase.apps.length) {
            console.error('Firebase not initialized');
            return;
        }
        
        // Initialize basic functionality
        initializeNavigation();
        initializeModal();
        initializeFormValidation();
        
        // Set up auth state observer
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    const userData = userDoc.data();
                    console.log('🟢 User is signed in:', {
                        name: userData?.name || 'No name found',
                        email: user.email,
                        uid: user.uid
                    });
                    
                    // Initialize user-specific functionality
                    handleAuthenticatedUser(user);
                    
                    // Initialize calendar if we're on the event page
                    if (document.querySelector('.calendar-grid')) {
                        renderCalendar();
                    }

                    // Load contacts if we're on the contacts page
                    if (document.querySelector('.contacts-table')) {
                        await loadAndDisplayContacts();
                    }
                } catch (error) {
                    console.log('🟢 User is signed in (no Firestore data):', {
                        email: user.email,
                        uid: user.uid
                    });
                }
            } else {
                console.log('🔴 User is signed out');
                handleSignedOutUser();
            }
        });

        // Initialize signin form if present
        const signinForm = document.querySelector('.signin-form');
        if (signinForm) {
            setupSigninValidation(signinForm);
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Add this function to initialize calendar event listeners
function initializeCalendarListeners() {
    // User selection buttons
    document.querySelectorAll('.user-button').forEach(button => {
        button.addEventListener('click', () => selectUser(button.dataset.user));
    });

    // Month navigation
    document.querySelector('.prev-month')?.addEventListener('click', previousMonth);
    document.querySelector('.next-month')?.addEventListener('click', nextMonth);
}

// Add/update the authentication handling functions
function handleAuthenticatedUser(user) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Redirect if on auth pages
    if (currentPage === 'signin.html' || currentPage === 'signup.html') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Show user-specific content
    const userPages = ['dashboard.html', 'contacts.html', 'event.html'];
    if (userPages.includes(currentPage)) {
        document.body.classList.add('authenticated');
        
        // Update user navigation
        updateUserNavigation(user);
    }
    
    // Hide loading overlay if it exists
    hideLoading();
}

function handleSignedOutUser() {
    // Handle signed out state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Only redirect if on protected pages and not already navigating away
    const protectedPages = ['dashboard.html', 'contacts.html', 'event.html'];
    if (protectedPages.includes(currentPage) && !window.location.href.includes('index.html')) {
        window.location.href = 'signin.html';
        return;
    }

    // Update UI for signed out state
    document.body.classList.remove('authenticated');
}

function initializeAuth() {
    // Check authentication state
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                console.log('🟢 User is signed in:', {
                    name: userData?.name || 'No name found',
                    email: user.email,
                    uid: user.uid
                });
                handleAuthenticatedUser(user);
            } catch (error) {
                console.log('🟢 User is signed in (no Firestore data):', {
                    email: user.email,
                    uid: user.uid
                });
            }
        } else {
            // User is signed out
            console.log('🔴 User is signed out');
            handleSignedOutUser();
        }
    });
}

// Make auth functions available globally
window.handleAuthenticatedUser = handleAuthenticatedUser;
window.handleSignedOutUser = handleSignedOutUser;
window.initializeAuth = initializeAuth;

// Make sure all necessary functions are available globally
window.handleSignIn = handleSignIn;
window.setupSigninValidation = setupSigninValidation;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.updateValidationUI = updateValidationUI;

// Add these functions near the other auth functions
function updateUserNavigation(user) {
    const userNameElement = document.querySelector('.user-nav .user-name');
    const userAvatarElement = document.querySelector('.user-nav .user-avatar');
    const logoutButton = document.querySelector('.logout-button');
    
    if (userNameElement && userAvatarElement && logoutButton) {
        // Get user's display name from Firestore
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                const userData = doc.data();
                const displayName = userData?.name || user.email;
                userNameElement.textContent = displayName;
                console.log('👤 Updated user navigation:', { displayName });
                
                // Set avatar initial
                userAvatarElement.textContent = displayName[0].toUpperCase();
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                userNameElement.textContent = user.email;
                userAvatarElement.textContent = user.email[0].toUpperCase();
            });

        // Add logout handler if not already added
        if (!logoutButton.hasEventListener) {
            logoutButton.addEventListener('click', handleLogout);
            logoutButton.hasEventListener = true;
        }
    }
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}

// Make additional functions available globally
window.updateUserNavigation = updateUserNavigation;
window.handleLogout = handleLogout;

// Calendar functionality
let currentDate = new Date();
let currentUser = 'user1';
let userSelections = {
    user1: new Set(),
    user2: new Set(),
    user3: new Set()
};

function selectUser(user) {
    currentUser = user;
    // Update active button state
    document.querySelectorAll('.user-button').forEach(btn => {
        btn.classList.remove('active');
    });
    const selectedButton = document.querySelector(`.user-button[data-user="${user}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    renderCalendar();
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function renderCalendar() {
    const monthYear = document.getElementById('monthYear');
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!monthYear || !calendarGrid) return;
    
    // Set month and year
    monthYear.textContent = currentDate.toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
    });

    // Remove existing day cells
    const days = document.querySelectorAll('.day:not(.weekday-header)');
    days.forEach(day => day.remove());

    // Get first day of month and total days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day empty';
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        dayElement.appendChild(dateNumber);
        
        const usersContainer = document.createElement('div');
        usersContainer.className = 'users';
        dayElement.appendChild(usersContainer);
        
        const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        // Add user selections
        Object.entries(userSelections).forEach(([user, dates]) => {
            if (dates.has(dateString)) {
                dayElement.classList.add(user);
                const userSpan = document.createElement('span');
                userSpan.className = `user-name ${user}`;
                userSpan.setAttribute('data-user', user);
                userSpan.textContent = user.replace('user', 'User ');
                usersContainer.appendChild(userSpan);
            }
        });

        dayElement.addEventListener('click', () => toggleDate(dayElement, dateString));
        calendarGrid.appendChild(dayElement);
    }

    updateDateList();
}

function toggleDate(element, dateString) {
    const usersContainer = element.querySelector('.users');
    
    if (userSelections[currentUser].has(dateString)) {
        userSelections[currentUser].delete(dateString);
        element.classList.remove(currentUser);
        const userSpan = usersContainer.querySelector(`.user-name[data-user="${currentUser}"]`);
        if (userSpan) userSpan.remove();
    } else {
        userSelections[currentUser].add(dateString);
        element.classList.add(currentUser);
        const userSpan = document.createElement('span');
        userSpan.className = `user-name ${currentUser}`;
        userSpan.setAttribute('data-user', currentUser);
        userSpan.textContent = currentUser.replace('user', 'User ');
        usersContainer.appendChild(userSpan);
    }
    updateDateList();
}

function updateDateList() {
    const dateList = document.getElementById('dateList');
    if (!dateList) return;
    
    dateList.innerHTML = '';
    
    // Get all unique dates
    const allDates = new Set([
        ...userSelections.user1,
        ...userSelections.user2,
        ...userSelections.user3
    ]);
    
    const sortedDates = Array.from(allDates).sort();
    
    // Filter for dates with multiple selections
    const availableDates = sortedDates.filter(date => {
        const userCount = [
            userSelections.user1.has(date),
            userSelections.user2.has(date),
            userSelections.user3.has(date)
        ].filter(Boolean).length;
        return userCount > 1;
    });

    if (availableDates.length === 0) {
        dateList.innerHTML = '<li>No dates with multiple selections yet</li>';
        return;
    }
    
    availableDates.forEach(date => {
        const li = document.createElement('li');
        const dateObj = new Date(date);
        
        // Create purple dot for multiple selections
        const userDots = '<span class="multi-user"></span>';
        
        li.innerHTML = `${userDots}${dateObj.toLocaleDateString('default', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`;
        dateList.appendChild(li);
    });
}

// Add these initialization functions near the top of the file
function initializeNavigation() {
    // Add navigation event listeners if needed
    console.log('Navigation initialized');
}

function initializeModal() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal .close-button');
    const newButton = document.querySelector('.nav-button.primary');

    // Close modal when clicking close button
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent form submission for button type="button"
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                // Reset form if exists
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        });
    });

    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                // Reset form if exists
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        });
    });

    // Open modal when clicking new button
    if (newButton) {
        newButton.addEventListener('click', () => {
            const isContactsPage = window.location.pathname.includes('contacts.html');
            const modalId = isContactsPage ? 'newContactModal' : 'newEventModal';
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
                // Focus on first input
                const firstInput = modal.querySelector('input:not([type="hidden"])');
                if (firstInput) firstInput.focus();
            }
        });
    }

    // Handle form submissions
    modals.forEach(modal => {
        const form = modal.querySelector('form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const isContactsPage = window.location.pathname.includes('contacts.html');
                    if (isContactsPage) {
                        await addNewContact(data);
                    } else {
                        await addNewEvent(data);
                    }
                    
                    modal.style.display = 'none';
                    form.reset();
                    // Refresh the page to show new data
                    window.location.reload();
                } catch (error) {
                    console.error('Error adding new item:', error);
                    alert('Error adding new item. Please try again.');
                }
            });
        }
    });
}

// Add these helper functions for adding new items
async function addNewContact(contactData) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    await db.collection('contacts').add({
        ...contactData,
        userId: user.uid,
        createdAt: new Date()
    });
}

async function addNewEvent(eventData) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    await db.collection('events').add({
        ...eventData,
        userId: user.uid,
        createdAt: new Date()
    });
}

function initializeFormValidation() {
    // Add form validation event listeners if needed
    console.log('Form validation initialized');
}

// Add loading state functions
function showLoading(message = 'Loading...') {
    const loadingOverlay = document.querySelector('.loading-overlay');
    const loadingText = loadingOverlay?.querySelector('.loading-text');
    
    if (loadingOverlay && loadingText) {
        loadingText.textContent = message;
        loadingOverlay.classList.add('show');
    }
}

function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
}

// Make loading functions available globally
window.showLoading = showLoading;
window.hideLoading = hideLoading;

// Add this function to handle loading and displaying contacts
async function loadAndDisplayContacts() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const contactsTable = document.querySelector('.contacts-table tbody');
        if (!contactsTable) return;

        // Show loading state
        showLoading('Loading contacts...');

        // Get contacts from Firestore
        const snapshot = await db.collection('contacts')
            .where('userId', '==', user.uid)
            .orderBy('name', 'asc')
            .get();

        // Clear existing table content
        contactsTable.innerHTML = '';

        if (snapshot.empty) {
            // Show empty state
            contactsTable.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="empty-state">
                            <p>You haven't added any contacts yet.</p>
                            <button class="button primary add-new-contact">
                                <span class="icon">+</span>
                                Add New Contact
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            // Add click handler for the "Add New Contact" button
            const addButton = contactsTable.querySelector('.add-new-contact');
            if (addButton) {
                addButton.addEventListener('click', () => {
                    const modal = document.getElementById('newContactModal');
                    if (modal) modal.style.display = 'block';
                });
            }
        } else {
            // Add contacts to table
            snapshot.forEach(doc => {
                const contact = doc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contact.name}</td>
                    <td>${contact.email}</td>
                    <td>${contact.phone || '-'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-button edit" data-id="${doc.id}">Edit</button>
                            <button class="action-button delete" data-id="${doc.id}">Delete</button>
                        </div>
                    </td>
                `;
                contactsTable.appendChild(row);

                // Add event listeners for edit and delete buttons
                const editButton = row.querySelector('.edit');
                const deleteButton = row.querySelector('.delete');

                editButton?.addEventListener('click', () => handleEditContact(doc.id));
                deleteButton?.addEventListener('click', () => handleDeleteContact(doc.id));
            });
        }

        hideLoading();
    } catch (error) {
        console.error('Error loading contacts:', error);
        hideLoading();
        alert('Error loading contacts. Please try again.');
    }
}

// Add these helper functions for contact actions
async function handleEditContact(contactId) {
    try {
        const doc = await db.collection('contacts').doc(contactId).get();
        if (!doc.exists) throw new Error('Contact not found');

        const contact = doc.data();
        const modal = document.getElementById('newContactModal');
        if (!modal) return;

        // Fill form with contact data
        const form = modal.querySelector('form');
        if (!form) return;

        form.querySelector('#contactName').value = contact.name;
        form.querySelector('#contactEmail').value = contact.email;
        form.querySelector('#contactPhone').value = contact.phone || '';

        // Update form submit handler for edit
        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                await db.collection('contacts').doc(contactId).update({
                    name: form.querySelector('#contactName').value,
                    email: form.querySelector('#contactEmail').value,
                    phone: form.querySelector('#contactPhone').value,
                    updatedAt: new Date()
                });

                modal.style.display = 'none';
                form.reset();
                window.location.reload();
            } catch (error) {
                console.error('Error updating contact:', error);
                alert('Error updating contact. Please try again.');
            }
        };

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error editing contact:', error);
        alert('Error editing contact. Please try again.');
    }
}

async function handleDeleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
        await db.collection('contacts').doc(contactId).delete();
        window.location.reload();
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Error deleting contact. Please try again.');
    }
}

// Make the function available globally
window.loadAndDisplayContacts = loadAndDisplayContacts; 