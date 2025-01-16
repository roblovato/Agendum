// Navigation highlighting
function initializeNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navButtons = document.querySelectorAll('.nav-button');
    
    navButtons.forEach(button => {
        // Remove any existing active classes
        button.classList.remove('active');
        
        // Check if this button links to the current page
        const href = button.getAttribute('href');
        if (href === currentPage) {
            button.classList.add('active');
        }
        
        // Special case for dashboard/events
        if (currentPage === 'dashboard.html' && button.textContent.trim() === 'Events') {
            button.classList.add('active');
        }
    });
}

// Modal functionality
function initializeModal() {
    const eventModal = document.getElementById('newEventModal');
    const contactModal = document.getElementById('newContactModal');
    const newButton = document.querySelector('.nav-button.primary');
    const closeButtons = document.querySelectorAll('.close-button');
    const cancelButtons = document.querySelectorAll('.button.cancel');
    const modalForms = document.querySelectorAll('.modal-form');

    // Determine which modal to use based on the page
    const modal = eventModal || contactModal;
    if (!modal) return; // Exit if we're not on a page with a modal

    function closeModal() {
        modal.classList.remove('show');
        modal.querySelector('form').reset();
    }

    // Open modal
    if (newButton) {
        newButton.addEventListener('click', () => {
            modal.classList.add('show');
        });
    }

    // Add close handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    cancelButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Handle form submissions
    modalForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                // Check if Firebase is initialized
                if (!firebase.apps.length) {
                    throw new Error('Firebase is not initialized');
                }

                // Check if user is authenticated
                const user = firebase.auth().currentUser;
                if (!user) {
                    throw new Error('You must be logged in to perform this action');
                }

                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                
                // If this is the event form, handle date formatting
                if (form.querySelector('#dateType')) {
                    handleEventFormSubmit(data, form);
                } else {
                    // Validate contact data
                    if (!data.name || !data.email || !data.phone) {
                        throw new Error('Please fill in all required fields');
                    }

                    // Show loading state
                    showLoading('Saving contact...');

                    // Save contact
                    await saveContactToFirebase({
                        name: data.name.trim(),
                        email: data.email.trim(),
                        phone: data.phone.trim()
                    });

                    // Close modal and reset form
                    closeModal();
                    
                    // Refresh contacts list
                    await loadAndDisplayContacts();
                }
            } catch (error) {
                console.error('Error processing form:', error);
                alert(error.message || 'An error occurred. Please try again.');
            } finally {
                hideLoading();
            }
        });
    });

    if (eventModal) {
        // Initialize select all functionality
        const selectAllCheckbox = document.getElementById('select-all-recipients');
        const recipientCheckboxes = document.querySelectorAll('input[name="recipients[]"]');

        selectAllCheckbox.addEventListener('change', (e) => {
            recipientCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });

        // Update "Select All" checkbox state based on individual selections
        function updateSelectAllState() {
            const checkedCount = document.querySelectorAll('input[name="recipients[]"]:checked').length;
            const totalCount = recipientCheckboxes.length;
            
            selectAllCheckbox.checked = checkedCount === totalCount;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;
        }

        recipientCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectAllState);
        });

        // Initialize date type toggle
        const dateTypeSelect = document.getElementById('dateType');
        if (dateTypeSelect) {
            dateTypeSelect.addEventListener('change', (e) => {
                toggleDateInputs(e.target.value);
            });
            
            // Set initial state
            toggleDateInputs(dateTypeSelect.value);
        }
    }

    // Setup form validations
    const contactForm = document.querySelector('#newContactModal .modal-form');
    const eventForm = document.querySelector('#newEventModal .modal-form');

    if (contactForm) {
        setupContactValidation(contactForm);
    }
    if (eventForm) {
        setupEventValidation(eventForm);
    }
}

// Move event-specific form handling to a separate function
function handleEventFormSubmit(eventData, form) {
    const dateType = eventData.dateType;
    
    // Handle date formatting
    if (dateType === 'single') {
        const date = eventData.singleDate;
        const time = eventData.singleTime;
        eventData.eventDateTime = `${date}T${time}`;
        delete eventData.startDate;
        delete eventData.endDate;
    } else {
        delete eventData.singleDate;
        delete eventData.singleTime;
    }

    // Handle recipients (convert to array)
    const recipients = Array.from(form.querySelectorAll('input[name="recipients[]"]:checked'))
        .map(checkbox => checkbox.value);
    eventData.recipients = recipients;

    console.log('Event form submitted with data:', eventData);
    form.closest('.modal').classList.remove('show');
    form.reset();
}

// Event Calendar functionality
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
    document.querySelector(`.user-button[onclick*="${user}"]`).classList.add('active');
}

function renderCalendar() {
    const monthYear = document.getElementById('monthYear');
    const calendarGrid = document.querySelector('.calendar-grid');
    
    // Remove existing day cells
    const days = document.querySelectorAll('.day');
    days.forEach(day => day.remove());

    // Set month and year
    monthYear.textContent = currentDate.toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
    });

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
        
        // Add user names with their respective colors
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
    if (!dateList) return; // Exit if we're not on the event page
    
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

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// Update the toggleDateInputs function in initializeModal
function toggleDateInputs(type) {
    const singleDateContainer = document.getElementById('singleDateContainer');
    const dateRangeContainer = document.getElementById('dateRangeContainer');

    if (type === 'single') {
        // Show single date, hide range
        singleDateContainer.classList.remove('hidden');
        dateRangeContainer.classList.add('hidden');
        
        // Update required attributes
        document.getElementById('singleDate').required = true;
        document.getElementById('singleTime').required = true;
        document.getElementById('startDate').required = false;
        document.getElementById('endDate').required = false;
    } else {
        // Show range, hide single
        singleDateContainer.classList.add('hidden');
        dateRangeContainer.classList.remove('hidden');
        
        // Update required attributes
        document.getElementById('singleDate').required = false;
        document.getElementById('singleTime').required = false;
        document.getElementById('startDate').required = true;
        document.getElementById('endDate').required = true;
    }
}

// Firebase Data Management
async function saveEventToFirebase(eventData) {
    try {
        // Add timestamp and user ID
        const enhancedEventData = {
            ...eventData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: firebase.auth().currentUser?.uid || 'anonymous'
        };

        // Save to Firestore
        const docRef = await db.collection('events').add(enhancedEventData);
        console.log('Event saved with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving event:', error);
        throw error;
    }
}

async function saveContactToFirebase(contactData) {
    // Check prerequisites
    if (!firebase.apps.length) {
        throw new Error('Firebase is not initialized');
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error('No authenticated user found');
    }

    try {
        // Add metadata to contact
        const enhancedContactData = {
            ...contactData,
            userId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore
        const docRef = await db.collection('contacts').add(enhancedContactData);
        console.log('Contact saved with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving contact:', error);
        throw new Error('Failed to save contact. Please try again.');
    }
}

async function loadEventsFromFirebase() {
    try {
        const userId = firebase.auth().currentUser?.uid || 'anonymous';
        const snapshot = await db.collection('events')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const events = [];
        snapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });

        return events;
    } catch (error) {
        console.error('Error loading events:', error);
        throw error;
    }
}

async function loadContactsFromFirebase() {
    try {
        const userId = firebase.auth().currentUser?.uid || 'anonymous';
        const snapshot = await db.collection('contacts')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const contacts = [];
        snapshot.forEach(doc => {
            contacts.push({ id: doc.id, ...doc.data() });
        });

        return contacts;
    } catch (error) {
        console.error('Error loading contacts:', error);
        throw error;
    }
}

// Add function to load and display contacts
async function loadAndDisplayContacts() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const contactsSnapshot = await db.collection('contacts')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const tableContainer = document.querySelector('.contacts-table');
        if (!tableContainer) return;

        if (contactsSnapshot.empty) {
            // Show empty state message
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <p>You don't have any contacts yet</p>
                    <button class="button primary add-new-contact">
                        <span class="icon">+</span>
                        Add New Contact
                    </button>
                </div>
            `;

            // Add click handler for the new contact button
            const addButton = tableContainer.querySelector('.add-new-contact');
            addButton.addEventListener('click', () => {
                const modal = document.getElementById('newContactModal');
                if (modal) modal.classList.add('show');
            });
            return;
        }

        // If we have contacts, show the table
        tableContainer.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;

        const tbody = tableContainer.querySelector('tbody');
        contactsSnapshot.forEach(doc => {
            const contact = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td>${contact.phone}</td>
                <td>
                    <button class="action-button edit" data-id="${doc.id}">Edit</button>
                    <button class="action-button delete" data-id="${doc.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);

            // Add event listeners for edit and delete buttons
            const deleteBtn = row.querySelector('.delete');
            deleteBtn.addEventListener('click', () => deleteContact(doc.id));
        });
    } catch (error) {
        console.error('Error loading contacts:', error);
        alert('Error loading contacts. Please try again.');
    }
}

// Add function to delete contacts
async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
        await db.collection('contacts').doc(contactId).delete();
        await loadAndDisplayContacts(); // Refresh the list
    } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Error deleting contact. Please try again.');
    }
}

// Add this near the top of the file, after the other initialization code
function initializeAuth() {
    // Check authentication state
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            console.log("User is signed in:", user);
            handleAuthenticatedUser(user);
        } else {
            // User is signed out
            console.log("User is signed out");
            handleSignedOutUser();
        }
    });
}

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

// Add these new functions
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
                
                // Set avatar initial
                userAvatarElement.textContent = displayName[0].toUpperCase();
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                userNameElement.textContent = user.email;
                userAvatarElement.textContent = user.email[0].toUpperCase();
            });

        // Add logout handler
        logoutButton.addEventListener('click', handleLogout);
    }
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
        // Redirect to index page instead of signin
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}

// Add these utility functions
function showLoading(message = 'Loading...') {
    const overlay = document.querySelector('.loading-overlay');
    if (!overlay) return; // Exit if overlay doesn't exist
    
    const loadingText = overlay.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = message;
    }
    overlay.classList.add('show');
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (!overlay) return; // Exit if overlay doesn't exist
    
    overlay.classList.remove('show');
}

// Add this form validation code
function initializeFormValidation() {
    const signupForm = document.querySelector('form.signup-form');
    const signinForm = document.querySelector('form.signin-form');

    if (signupForm) {
        setupSignupValidation(signupForm);
    } else if (signinForm) {
        setupSigninValidation(signinForm);
    }
}

function setupSignupValidation(form) {
    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');
    const confirmPasswordInput = form.querySelector('#confirmPassword');
    
    // Add show/hide password functionality
    const passwordToggles = form.querySelectorAll('.show-password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const passwordField = e.target.closest('.password-container').querySelector('input[type="password"], input[type="text"]');
            passwordField.type = e.target.checked ? 'text' : 'password';
        });
    });

    // Name validation
    nameInput.addEventListener('input', () => validateName(nameInput));
    emailInput.addEventListener('input', () => validateEmail(emailInput));
    passwordInput.addEventListener('input', () => {
        validatePassword(passwordInput);
        if (confirmPasswordInput.value) {
            validateConfirmPassword(confirmPasswordInput, passwordInput);
        }
    });
    confirmPasswordInput.addEventListener('input', () => {
        validateConfirmPassword(confirmPasswordInput, passwordInput);
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const isNameValid = validateName(nameInput);
        const isEmailValid = validateEmail(emailInput);
        const isPasswordValid = validatePassword(passwordInput);
        const isConfirmValid = validateConfirmPassword(confirmPasswordInput, passwordInput);

        if (isNameValid && isEmailValid && isPasswordValid && isConfirmValid) {
            try {
                showLoading('Creating your account...');
                
                // Create user with Firebase Auth
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(
                    emailInput.value,
                    passwordInput.value
                );

                // Add user details to Firestore
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Error during signup:', error);
                hideLoading();
                alert(error.message);
            }
        }
    });
}

function setupSigninValidation(form) {
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');

    // Email validation
    emailInput.addEventListener('input', () => validateEmail(emailInput));

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const isEmailValid = validateEmail(emailInput);
        const isPasswordFilled = passwordInput.value.length > 0;

        if (isEmailValid && isPasswordFilled) {
            try {
                showLoading('Signing in...');
                
                await firebase.auth().signInWithEmailAndPassword(
                    emailInput.value,
                    passwordInput.value
                );
                // Redirect is handled by handleAuthenticatedUser
            } catch (error) {
                console.error('Error during sign in:', error);
                hideLoading();
                alert(error.message);
            }
        } else {
            // Show validation messages
            updateValidationUI(emailInput, isEmailValid, 'Please enter a valid email address');
            updateValidationUI(passwordInput, isPasswordFilled, 'Password is required');
        }
    });
}

// Validation helper functions
function validateName(input) {
    const value = input.value.trim();
    const isValid = /^[a-zA-Z\s]{2,}$/.test(value);
    updateValidationUI(input, isValid, 'Name must contain at least 2 letters (only letters and spaces allowed)');
    return isValid;
}

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

function validateConfirmPassword(input, passwordInput) {
    const isValid = input.value === passwordInput.value && input.value !== '';
    updateValidationUI(input, isValid, 'Passwords must match');
    return isValid;
}

// Add this with the other validation helper functions
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

// Add contact form validation
function setupContactValidation(form) {
    const nameInput = form.querySelector('#contactName');
    const emailInput = form.querySelector('#contactEmail');
    const phoneInput = form.querySelector('#contactPhone');

    // Real-time validation
    nameInput.addEventListener('input', () => validateContactName(nameInput));
    emailInput.addEventListener('input', () => validateEmail(emailInput));
    phoneInput.addEventListener('input', () => validatePhone(phoneInput));

    // Form submission validation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isNameValid = validateContactName(nameInput);
        const isEmailValid = validateEmail(emailInput);
        const isPhoneValid = validatePhone(phoneInput);

        if (isNameValid && isEmailValid && isPhoneValid) {
            // Proceed with form submission
            // ... existing contact submission code ...
        }
    });
}

// Add event form validation
function setupEventValidation(form) {
    const titleInput = form.querySelector('#eventTitle');
    const descriptionInput = form.querySelector('#eventDescription');
    const dateInputs = form.querySelectorAll('input[type="date"]');
    const timeInputs = form.querySelectorAll('input[type="time"]');

    // Real-time validation
    titleInput.addEventListener('input', () => validateEventTitle(titleInput));
    
    // Form submission validation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isTitleValid = validateEventTitle(titleInput);
        const areDatesValid = validateDates(dateInputs, timeInputs);

        if (isTitleValid && areDatesValid) {
            // Proceed with form submission
            // ... existing event submission code ...
        }
    });
}

// Add these validation helper functions
function validateContactName(input) {
    const value = input.value.trim();
    const isValid = value.length >= 2 && /^[a-zA-Z\s]+$/.test(value);
    updateValidationUI(input, isValid, 'Name must contain at least 2 letters (only letters and spaces allowed)');
    return isValid;
}

function validatePhone(input) {
    const value = input.value.trim();
    const isValid = /^[\d\(\)\-\s]+$/.test(value) && value.length >= 10;
    updateValidationUI(input, isValid, 'Please enter a valid phone number');
    return isValid;
}

function validateEventTitle(input) {
    const value = input.value.trim();
    const isValid = value.length >= 3;
    updateValidationUI(input, isValid, 'Title must be at least 3 characters long');
    return isValid;
}

function validateDates(dateInputs, timeInputs) {
    let isValid = true;
    dateInputs.forEach((input, index) => {
        if (input.required && !input.value) {
            isValid = false;
            updateValidationUI(input, false, 'Date is required');
        }
        if (timeInputs[index] && timeInputs[index].required && !timeInputs[index].value) {
            isValid = false;
            updateValidationUI(timeInputs[index], false, 'Time is required');
        }
    });
    return isValid;
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase to initialize
    try {
        // Check if Firebase is initialized
        if (!firebase.apps.length) {
            console.error('Firebase not initialized');
            return;
        }
        
        // Initialize all other functionality
        initializeNavigation();
        initializeModal();
        initializeFormValidation();
        initializeAuth();
        
        // Initialize calendar if we're on the event page
        if (document.querySelector('.calendar-grid')) {
            renderCalendar();
        }

        // Load events if we're on the dashboard
        if (document.querySelector('.events-table')) {
            // await loadAndDisplayEvents();
        }

        // Load contacts if we're on the contacts page
        if (document.querySelector('.events-table') && window.location.pathname.includes('contacts.html')) {
            await loadAndDisplayContacts();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}); 