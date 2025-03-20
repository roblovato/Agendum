// Export functions that need to be accessed by inline event handlers
window.selectUser = selectUser;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;

// Add this function near the top of the file with other utility functions
function isMobileViewport() {
    // Check if viewport width is less than 768px (common mobile breakpoint)
    const isMobile = window.innerWidth < 768;
    return isMobile;
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    isMobileViewport();
    // ... rest of your initialization code ...

    // Add click handler for all modal cancel buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-cancel')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        }
    });
});

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
        initializeAuth();

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

// Initialize Firebase Auth state for all pages
function initializeAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        try {
            const currentPath = window.location.pathname;
            
            if (user) {
                // User is signed in
                if (currentPath.includes('signin.html') || 
                    currentPath.includes('signup.html') || 
                    currentPath === '/' || 
                    currentPath.endsWith('index.html')) {
                    window.location.href = 'dashboard.html';
                } else if (currentPath.includes('dashboard.html')) {
                    initializeDashboard(user);
                }
            } else {
                // User is signed out
                console.log('🔴 User is signed out');
                // Only redirect to signin if on protected pages
                if (!currentPath.includes('signin.html') && 
                    !currentPath.includes('signup.html') && 
                    !currentPath.includes('index.html')) {
                    window.location.href = 'signin.html';
                }
            }
        } catch (error) {
            console.error('Error in auth state change:', error);
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 2rem;">
                        <h3>Error Loading Content</h3>
                        <p>${error.message}</p>
                        <button onclick="window.location.reload()" class="button primary" style="margin-top: 1rem;">
                            Retry
                        </button>
                    </div>
                `;
            }
        }
    });
}

// Initialize dashboard with user data
async function initializeDashboard(user) {
    try {
        // Show loading state
        showLoading('Loading dashboard...');

        // Initialize components
        initializeModal();
        initializeFormValidation();
        
        // Update user info in the nav
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = user.email;
        }

        // Add logout handler
        const logoutButton = document.querySelector('.logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                firebase.auth().signOut()
                    .then(() => {
                        window.location.href = 'index.html';
                    })
                    .catch((error) => {
                        console.error('Error signing out:', error);
                        alert('Error signing out. Please try again.');
                    });
            });
        }

        // Load events
        await loadAndDisplayEvents();

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 2rem;">
                    <h3>Error Loading Dashboard</h3>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" class="button primary" style="margin-top: 1rem;">
                        Retry
                    </button>
                </div>
            `;
        }
    } finally {
        hideLoading();
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});

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
}

// Add phone number formatting and validation
function formatPhoneNumber(input) {
    // Remove all non-digit characters
    let phoneNumber = input.replace(/\D/g, '');
    
    // Ensure it's not longer than 10 digits
    phoneNumber = phoneNumber.substring(0, 10);
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length >= 6) {
        return `(${phoneNumber.substring(0,3)}) ${phoneNumber.substring(3,6)}-${phoneNumber.substring(6)}`;
    } else if (phoneNumber.length >= 3) {
        return `(${phoneNumber.substring(0,3)}) ${phoneNumber.substring(3)}`;
    } else if (phoneNumber.length > 0) {
        return `(${phoneNumber}`;
    }
    return phoneNumber;
}

// Update initializeModal function to handle all modals generically
function initializeModal() {
    // Get all modals
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Get close elements for this modal
        const closeButton = modal.querySelector('.close-button');
        const cancelButton = modal.querySelector('.button.secondary');
        const form = modal.querySelector('form');

        function closeModal() {
            // Reset form if exists
            if (form) {
                form.reset();
                // Clear validation states
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    input.classList.remove('invalid', 'valid');
                    const container = input.closest('.input-container');
                    if (container) {
                        const errorMessage = container.querySelector('.error-message');
                        if (errorMessage) {
                            errorMessage.textContent = '';
                        }
                    }
                });
            }
            // Hide modal
            modal.classList.remove('show');
            if (modal.style.display) {
                modal.style.display = 'none';
            }
        }

        // Close button handler
        if (closeButton) {
            closeButton.onclick = closeModal;
        }

        // Cancel button handler
        if (cancelButton) {
            cancelButton.onclick = closeModal;
        }

        // Click outside modal handler
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
}

// Make sure to call initializeModal when the page loads and after dynamic content is added
document.addEventListener('DOMContentLoaded', () => {
    initializeModal();
});

// Update addNewContact function
async function addNewContact(contactData) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        // Validate required fields
        if (!contactData.name?.trim()) throw new Error('Name is required');
        if (!contactData.email?.trim()) throw new Error('Email is required');

        // Format phone number if provided
        let formattedPhone = '';
        if (contactData.phone) {
            // Remove all non-digits
            const digits = contactData.phone.replace(/\D/g, '');
            // Format as (XXX) XXX-XXXX
            formattedPhone = digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        }

        // Create contact object with validated/formatted data
        const contact = {
            name: contactData.name.trim(),
            email: contactData.email.trim(),
            phone: formattedPhone,
            userId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore
        await db.collection('contacts').add(contact);
        
        // Close modal and refresh contacts
        const modal = document.getElementById('newContactModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
        
        // Refresh contacts list
        await loadAndDisplayContacts();

    } catch (error) {
        console.error('Error adding contact:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

// Update the handleViewEvent function
async function handleViewEvent(eventId) {
    try {
        // Open event in new tab
        window.open(`/event.html?id=${eventId}`, '_blank');
    } catch (error) {
        console.error('Error viewing event:', error);
        alert('Error viewing event. Please try again.');
    }
}

async function handleEditEvent(eventId) {
    try {
        const doc = await db.collection('events').doc(eventId).get();
        if (!doc.exists) throw new Error('Event not found');

        const event = doc.data();
        
        // Log the event being edited
        // console.log('Editing event:', {
        //     id: eventId,
        //     ...event,
        //     date: event.date || null,
        //     startDate: event.startDate || null,
        //     endDate: event.endDate || null,
        //     invitees: event.invitees || []
        // });
        // return;

        const modal = document.getElementById('newEventModal');
        if (!modal) return;

        // Update form with event data
        const form = modal.querySelector('form');
        if (!form) return;

        // Fill in basic fields
        form.querySelector('#eventTitle').value = event.title || '';
        form.querySelector('#eventDescription').value = event.description || '';
        form.querySelector('#eventLocation').value = event.location || '';

        // Show modal first so Flatpickr can initialize properly
        modal.style.display = 'block';
        
        // Initialize date pickers
        const pickers = initializeDatePickers();
        
        // Set date type
        const dateTypeSelect = form.querySelector('#dateType');
        if (dateTypeSelect) {
            dateTypeSelect.value = event.dateType;
            
            const singleDateGroup = document.getElementById('singleDateGroup');
            const dateRangeGroup = document.getElementById('dateRangeGroup');
            
            // Handle date fields based on type
            if (event.dateType === 'multi') {
                // Multi-day event
                if (singleDateGroup) singleDateGroup.style.display = 'none';
                if (dateRangeGroup) dateRangeGroup.style.display = 'block';
                
                // Set date range values after a short delay
                setTimeout(() => {
                    if (pickers.startDatePicker && event.startDate) {
                        pickers.startDatePicker.setDate(event.startDate);
                    }
                    if (pickers.endDatePicker && event.endDate) {
                        pickers.endDatePicker.setDate(event.endDate);
                    }
                }, 100);
            } else {
                // Single day event
                if (singleDateGroup) singleDateGroup.style.display = 'block';
                if (dateRangeGroup) dateRangeGroup.style.display = 'none';
                
                // Set single date value after a short delay
                setTimeout(() => {
                    if (pickers.eventDatePicker && event.date) {
                        pickers.eventDatePicker.setDate(event.date);
                    }
                }, 100);
            }
        }

        // Load invitees list and wait for it to complete
        await loadInviteesList();

        // Check invitees after list is loaded
        event.invitees?.forEach(inviteeId => {
            const checkbox = form.querySelector(`#invitee-${inviteeId}`);
            if (checkbox) checkbox.checked = true;
        });

        // Update modal title and button
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Save Changes';

        // Add event ID to form for update
        const eventIdInput = document.createElement('input');
        eventIdInput.type = 'hidden';
        eventIdInput.name = 'eventId';
        eventIdInput.value = eventId;
        form.appendChild(eventIdInput);

    } catch (error) {
        console.error('Error editing event:', error);
        alert('Error editing event. Please try again.');
    }
}

// Add delete handlers
async function handleDeleteEvent(eventId) {
    try {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        showLoading('Deleting event...');
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        // Get event to verify ownership
        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) throw new Error('Event not found');
        
        const eventData = eventDoc.data();
        if (eventData.createdBy.userId !== user.uid) {
            throw new Error('You can only delete your own events');
        }

        // Delete the event
        await db.collection('events').doc(eventId).delete();
        
        // Refresh the events list
        await loadAndDisplayEvents();
        hideLoading();
    } catch (error) {
        console.error('Error deleting event:', error);
        hideLoading();
        alert(error.message || 'Error deleting event. Please try again.');
    }
}

// Add this function to send SMS notifications
async function sendEventInvites(eventId, invitees) {
    try {
        // Get event details
        const eventDoc = await db.collection('public_events').doc(eventId).get();
        if (!eventDoc.exists) throw new Error('Event not found');
        const event = eventDoc.data();

        // Get invitee details
        const inviteePromises = invitees.map(id => 
            db.collection('contacts').doc(id).get()
        );
        const inviteeDocs = await Promise.all(inviteePromises);

        // Prepare message
        const eventUrl = `${window.location.origin}/event.html?id=${eventId}`;
        const message = `You've been invited to "${event.title}"! View details at: ${eventUrl}`;

        // Send SMS to each invitee with phone number
        const smsPromises = inviteeDocs
            .filter(doc => doc.exists && doc.data().phone)
            .map(doc => {
                const contact = doc.data();
                return fetch('/api/send-sms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: contact.phone,
                        message: message
                    })
                });
            });

        await Promise.all(smsPromises);
        console.log('SMS notifications sent successfully');
    } catch (error) {
        console.error('Error sending SMS notifications:', error);
        // Don't throw error to prevent blocking event creation
    }
}

// Update addNewEvent function
async function addNewEvent(eventData) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
        // Format the event data
        const formattedData = {
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            dateType: eventData.dateType,
            date: eventData.dateType === 'single' ? eventData.date : null,
            startDate: eventData.dateType === 'multi' ? eventData.startDate : null,
            endDate: eventData.dateType === 'multi' ? eventData.endDate : null,
            invitees: Array.from(document.querySelectorAll('.invitee-checkbox:checked'))
                .map(checkbox => checkbox.value),
            createdBy: {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName || 'Anonymous'
            },
            lastUpdated: new Date()
        };

        // Check if this is an update or new event
        const eventId = eventData.eventId;
        if (eventId) {
            console.log('Updating existing event:', eventId);
            // Update existing event
            await db.collection('events').doc(eventId).update({
                ...formattedData,
                lastUpdated: new Date()
            });
            
            // Update public event
            await db.collection('public_events').doc(eventId).update({
                ...formattedData,
                lastUpdated: new Date()
            });
            console.log('Successfully updated both events and public_events collections');

            return eventId;
        } else {
            console.log('Creating new event with data:', formattedData);
            // Create new event
            formattedData.createdAt = new Date();
            formattedData.status = 'active';
            formattedData.isPublic = true;

            const eventRef = await db.collection('events').add(formattedData);
            console.log('Created event in events collection:', eventRef.id);
            
            // Create public event with initial empty availability array
            await db.collection('public_events').doc(eventRef.id).set({
                ...formattedData,
                eventId: eventRef.id,
                availability: [], // Initialize empty availability array
                responses: {}    // Initialize empty responses object
            });
            console.log('Created event in public_events collection:', eventRef.id);

            return eventRef.id;
        }
    } catch (error) {
        console.error('Error saving event:', error);
        throw new Error('Failed to save event. Please try again.');
    }
}

// Update initializeFormValidation to handle case when pickers is null
function initializeFormValidation() {
    const form = document.querySelector('#newEventModal form');
    if (!form) return;

    // Remove any existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Initialize date pickers only if we're on a page with date inputs
    const dateInputs = newForm.querySelectorAll('input[type="date"]');
    if (dateInputs.length > 0) {
        const pickers = initializeDatePickers();
    }

    // Add single form submission handler
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const title = newForm.querySelector('#eventTitle');
        const startDate = newForm.querySelector('#startDate');
        const endDate = newForm.querySelector('#endDate');
        const location = newForm.querySelector('#eventLocation');
        
        let isValid = true;
        
        [title, startDate, endDate, location].forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        if (!isValid) return;
        
        try {
            // Check if this is an edit or new event
            const eventId = newForm.dataset.eventId;
            if (eventId) {
                // Update existing event
                await updateEvent(eventId, newForm);
            } else {
                // Create new event
                await saveEvent(newForm);
            }

            // Close modal and refresh events
            const modal = document.getElementById('newEventModal');
            if (modal) {
                modal.style.display = 'none';
                newForm.reset();
                if (typeof flatpickr !== 'undefined') {
                    const startDateInput = document.querySelector('#startDate');
                    const endDateInput = document.querySelector('#endDate');
                    if (startDateInput._flatpickr) startDateInput._flatpickr.clear();
                    if (endDateInput._flatpickr) endDateInput._flatpickr.clear();
                }
            }
            await loadAndDisplayEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            showError(title, 'Error saving event. Please try again.');
        }
    });
}

// Add updateEvent function
async function updateEvent(eventId, form) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const formData = new FormData(form);
    
    const eventData = {
        title: formData.get('title').trim(),
        description: formData.get('description')?.trim() || '',
        location: formData.get('location').trim(),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('events').doc(eventId).update(eventData);
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

// Update the loadAndDisplayContacts function
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

        // Clear existing table content before adding new rows
        contactsTable.innerHTML = '';

        if (snapshot.empty) {
            // Show empty state
            contactsTable.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <p>You haven't added any contacts yet.</p>
                        <button class="button primary add-new-contact">
                            <span class="icon">+</span>
                            Add New Contact
                        </button>
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
                    <td>${contact.name || ''}</td>
                    <td>${contact.email || ''}</td>
                    <td>${contact.phone ? formatPhoneNumber(contact.phone.substring(2)) : '-'}</td>
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

                if (editButton) {
                    editButton.addEventListener('click', () => handleEditContact(doc.id));
                }
                if (deleteButton) {
                    deleteButton.addEventListener('click', () => handleDeleteContact(doc.id));
                }
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

        // Update modal title and button
        const modalTitle = modal.querySelector('#contactModalTitle');
        const submitBtn = modal.querySelector('#contactSubmitBtn');
        if (modalTitle) modalTitle.textContent = 'Edit Contact';
        if (submitBtn) submitBtn.textContent = 'Save Changes';

        // Fill form with contact data
        const form = modal.querySelector('form');
        if (!form) return;

        const contactIdInput = form.querySelector('#contactId');
        if (contactIdInput) contactIdInput.value = contactId;

        form.querySelector('#contactName').value = contact.name || '';
        form.querySelector('#contactEmail').value = contact.email || '';
        form.querySelector('#contactPhone').value = contact.phone || '';

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error editing contact:', error);
        alert('Error editing contact. Please try again.');
    }
}

async function handleDeleteContact(contactId) {
    try {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        
        showLoading('Deleting contact...');
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        // Get contact to verify ownership
        const contactDoc = await db.collection('contacts').doc(contactId).get();
        if (!contactDoc.exists) throw new Error('Contact not found');
        
        const contactData = contactDoc.data();
        if (contactData.userId !== user.uid) {
            throw new Error('You can only delete your own contacts');
        }

        // Delete the contact
        await db.collection('contacts').doc(contactId).delete();
        
        // Refresh the contacts list
        await loadAndDisplayContacts();
        hideLoading();
    } catch (error) {
        console.error('Error deleting contact:', error);
        hideLoading();
        alert(error.message || 'Error deleting contact. Please try again.');
    }
}

// Make the function available globally
window.loadAndDisplayContacts = loadAndDisplayContacts;

// Update the date picker initialization function
function initializeDatePickers() {
    // First, find the input elements
    const startDateInput = document.querySelector("#startDate");
    const endDateInput = document.querySelector("#endDate");
    const eventDateInput = document.querySelector("#eventDate");

    // If none of the date inputs exist, return early
    if (!startDateInput && !endDateInput && !eventDateInput) {
        return null;
    }

    // Destroy existing instances if they exist
    if (startDateInput?._flatpickr) startDateInput._flatpickr.destroy();
    if (endDateInput?._flatpickr) endDateInput._flatpickr.destroy();
    if (eventDateInput?._flatpickr) eventDateInput._flatpickr.destroy();

    const today = new Date();
    const defaultOptions = {
        enableTime: false,
        dateFormat: "Y-m-d",
        minDate: today,
        disableMobile: false,
        locale: {
            firstDayOfWeek: 1
        }
    };

    let pickers = {};

    // Only initialize pickers for elements that exist
    if (eventDateInput) {
        pickers.eventDatePicker = flatpickr("#eventDate", {
            ...defaultOptions,
            defaultDate: today,
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
        });
    }

    if (startDateInput) {
        pickers.startDatePicker = flatpickr("#startDate", {
            ...defaultOptions,
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
            onChange: function(selectedDates) {
                if (selectedDates[0] && pickers.endDatePicker) {
                    pickers.endDatePicker.set('minDate', selectedDates[0]);
                }
            }
        });
    }

    if (endDateInput) {
        pickers.endDatePicker = flatpickr("#endDate", {
            ...defaultOptions,
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d",
        });
    }

    return pickers;
}

// Update the initializeDateTypeHandler function
function initializeDateTypeHandler() {
    const dateTypeSelect = document.getElementById('dateType');
    const singleDateGroup = document.getElementById('singleDateGroup');
    const dateRangeGroup = document.getElementById('dateRangeGroup');
    const pickers = initializeDatePickers();

    if (!dateTypeSelect || !singleDateGroup || !dateRangeGroup) return;

    // Function to show single date input
    function showSingleDate() {
        singleDateGroup.style.display = 'block';
        dateRangeGroup.style.display = 'none';
        
        const eventDate = document.getElementById('eventDate');
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');

        if (eventDate) {
            eventDate.disabled = false;
            eventDate.required = true;
        }

        if (startDate) {
            startDate.disabled = true;
            startDate.required = false;
            startDate.value = '';
        }

        if (endDate) {
            endDate.disabled = true;
            endDate.required = false;
            endDate.value = '';
        }

        // Set default date if empty
        if (eventDate && !eventDate.value && pickers.eventDatePicker) {
            pickers.eventDatePicker.setDate(new Date());
        }
    }

    // Function to show date range inputs
    function showDateRange() {
        singleDateGroup.style.display = 'none';
        dateRangeGroup.style.display = 'block';
        
        const eventDate = document.getElementById('eventDate');
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');

        if (eventDate) {
            eventDate.disabled = true;
            eventDate.required = false;
            eventDate.value = '';
        }

        if (startDate) {
            startDate.disabled = false;
            startDate.required = true;
        }

        if (endDate) {
            endDate.disabled = false;
            endDate.required = true;
        }

        // Set default dates if empty
        if (!startDate.value && !endDate.value) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (pickers.startDatePicker) pickers.startDatePicker.setDate(today);
            if (pickers.endDatePicker) pickers.endDatePicker.setDate(tomorrow);
        }
    }

    // Handle date type changes
    dateTypeSelect.addEventListener('change', function() {
        if (this.value === 'multi') {
            showDateRange();
        } else {
            showSingleDate();
        }
    });

    // Set initial state
    if (dateTypeSelect.value === 'multi') {
        showDateRange();
    } else {
        showSingleDate();
    }
}

// Add this function to load contacts into the invitees list
async function loadInviteesList() {
    const inviteesList = document.getElementById('inviteesList');
    if (!inviteesList) return;

    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        // Get contacts from Firestore
        const snapshot = await db.collection('contacts')
            .where('userId', '==', user.uid)
            .orderBy('name', 'asc')
            .get();

        // Clear loading state
        inviteesList.innerHTML = '';

        if (snapshot.empty) {
            inviteesList.innerHTML = `
                <div class="empty-state">
                    <p>No contacts found. Add contacts to invite them to events.</p>
                </div>
            `;
            return;
        }

        // Add each contact as a checkbox item
        snapshot.forEach(doc => {
            const contact = doc.data();
            const inviteeItem = document.createElement('div');
            inviteeItem.className = 'invitee-item';
            inviteeItem.innerHTML = `
                <input type="checkbox" 
                       class="invitee-checkbox" 
                       name="invitees" 
                       value="${doc.id}" 
                       id="invitee-${doc.id}">
                <label class="invitee-name" for="invitee-${doc.id}">
                    ${contact.name}
                </label>
            `;
            inviteesList.appendChild(inviteeItem);
        });
    } catch (error) {
        console.error('Error loading contacts:', error);
        inviteesList.innerHTML = `
            <div class="error-state">
                <p>Error loading contacts. Please try again.</p>
            </div>
        `;
    }
}

// Add this variable at the top of the file to track the currently open event
let currentlyOpenEvent = null;

// Update the loadAndDisplayEvents function to handle event expansion
async function loadAndDisplayEvents() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    try {
        showLoading('Loading events...');

        let user = firebase.auth().currentUser;
        if (!user) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            user = firebase.auth().currentUser;
            if (!user) throw new Error('User not authenticated');
        }

        const eventsSnapshot = await db.collection('events')
            .where('createdBy.userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        // Clear main content
        mainContent.innerHTML = '';

        // Create events container
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-container';

        // Add header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'events-header';
        headerDiv.innerHTML = `
            <div class="event-col">Event</div>
            <div class="date-col">Start Date</div>
            <div class="date-col">End Date</div>
            <div class="actions-col">Actions</div>
        `;
        eventsContainer.appendChild(headerDiv);

        // Create events list container
        const eventsList = document.createElement('div');
        eventsList.className = 'events-list';
        eventsContainer.appendChild(eventsList);

        // Add events
        eventsSnapshot.forEach(doc => {
            const event = doc.data();
            // console.log('Event', event);
            
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-row';
            
            eventDiv.innerHTML = `
                <div class="event-summary">
                    <div class="event-col">
                        <span class="expand-icon">${chevronIcon}</span>
                        ${event.title}
                    </div>
                    <div class="date-col" data-date="${event.startDate}">${formatDate(event.startDate)}</div>
                    <div class="date-col" data-date="${event.endDate}">${formatDate(event.endDate)}</div>
                    <div class="actions-col">
                        <button class="button view-button" data-id="${doc.id}">
                            <span class="icon">${viewIcon}</span>
                        </button>
                        <button class="button edit-button" data-id="${doc.id}">
                            <span class="icon">${editIcon}</span>
                        </button>
                        <button class="button delete-button" data-id="${doc.id}">
                            <span class="icon">${deleteIcon}</span>
                        </button>
                    </div>
                </div>
                <div class="event-details">
                    <div class="details-grid">
                        ${window.innerWidth <= 768 ? `
                            <div class="detail-section dates">
                                <div>
                                    <h4>Start Date</h4>
                                    <p>${formatDate(event.startDate)}</p>
                                </div>
                                <div>
                                    <h4>End Date</h4>
                                    <p>${formatDate(event.endDate)}</p>
                                </div>
                            </div>
                        ` : ''}
                        <div class="detail-section">
                            <h4>Description</h4>
                            <p>${event.description || 'No description provided.'}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Location</h4>
                            <p>${event.location}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Status</h4>
                            <p class="event-status ${getEventStatus(event.startDate)}">${getEventStatus(event.startDate)}</p>
                        </div>
                        <div class="detail-section">
                            <h4>Responses</h4>
                            <div class="responses-info">
                                <p class="responses-count">${Array.isArray(event.responses) ? event.responses.length : 0} people invited</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Update click handler for expansion
            const eventCol = eventDiv.querySelector('.event-summary');
            const detailsDiv = eventDiv.querySelector('.event-details');
            const expandIcon = eventCol.querySelector('.expand-icon');
            
            eventCol.addEventListener('click', async (e) => {
                if (!e.target.closest('.actions-col')) {
                    // Get availability data from public_events collection
                    try {
                        const publicEventRef = await db.collection('public_events').doc(doc.id).get();
                        const publicEventData = publicEventRef.data() || {};
                        const responsesCount = Object.keys(publicEventData?.responses || {}).length;

                        // If clicking the currently open event, just close it
                        if (currentlyOpenEvent === detailsDiv) {
                            expandIcon.classList.remove('expanded');
                            const grid = detailsDiv.querySelector('.details-grid');
                            grid.style.maxHeight = '0';
                            detailsDiv.style.display = 'none'; // Hide immediately
                            detailsDiv.classList.remove('expanded');
                            currentlyOpenEvent = null;
                            return;
                        }

                        // Close the currently open event if there is one
                        if (currentlyOpenEvent) {
                            const previousIcon = currentlyOpenEvent.parentElement.querySelector('.expand-icon');
                            previousIcon.classList.remove('expanded');
                            currentlyOpenEvent.style.display = 'none'; // Hide immediately
                            currentlyOpenEvent.classList.remove('expanded');
                            const previousGrid = currentlyOpenEvent.querySelector('.details-grid');
                            previousGrid.style.maxHeight = '0';
                        }

                        // Open the clicked event
                        detailsDiv.style.display = 'block';
                        // Force a reflow to enable the transition
                        detailsDiv.offsetHeight;
                        const grid = detailsDiv.querySelector('.details-grid');
                        grid.style.maxHeight = '500px';
                        const count = detailsDiv.querySelector('.responses-count');
                        count.innerHTML = `${responsesCount}`;
                        detailsDiv.classList.add('expanded');
                        expandIcon.classList.add('expanded');
                        currentlyOpenEvent = detailsDiv;

                    } catch (error) {
                        console.error('Error fetching availability data:', error);
                    }
                }
            });

            eventsList.appendChild(eventDiv);
        });

        mainContent.appendChild(eventsContainer);

        // Add event listeners for buttons
        addEventButtonListeners(eventsContainer);

        // Add scroll handler after creating events container
        eventsContainer.addEventListener('scroll', () => {
            if (eventsContainer.scrollTop > 0) {
                eventsContainer.classList.add('scrolled');
            } else {
                eventsContainer.classList.remove('scrolled');
            }
        });

    } catch (error) {
        console.error('Error loading events:', error);
        mainContent.innerHTML = `
            <div class="error-message">
                Error loading events: ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Update the formatDate function to handle mobile formatting
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    
    // Check if viewport is mobile
    if (window.innerWidth <= 768) {
        // Mobile format: MM/DD/YY
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
        });
    } else {
        // Desktop format: Month DD, YYYY
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Update resize listener to handle both date columns and details
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    
    // Update date columns
    const dateElements = document.querySelectorAll('.date-col');
    if (dateElements) {
        dateElements.forEach(element => {
            if (element && element.hasAttribute('data-date')) {
                const originalDate = element.getAttribute('data-date');
                if (originalDate) {
                    element.textContent = formatDate(originalDate);
                }
            }
        });
    }

    // Update details sections
    const detailsGrids = document.querySelectorAll('.details-grid');
    if (detailsGrids) {
        detailsGrids.forEach(grid => {
            if (!grid) return;

            const datesSection = grid.querySelector('.detail-section.dates');
            const event = grid.closest('.event-row');
            if (!event) return;
            
            if (isMobile && !datesSection) {
                // Add dates section if on mobile
                const startDateCol = event.querySelector('.date-col[data-date]');
                const endDateCol = event.querySelector('.date-col[data-date]:last-of-type');
                
                if (startDateCol && endDateCol) {
                    const startDate = startDateCol.getAttribute('data-date');
                    const endDate = endDateCol.getAttribute('data-date');
                    
                    if (startDate && endDate) {
                        const datesSectionHTML = `
                            <div class="detail-section dates">
                                <div>
                                    <h4>Start Date</h4>
                                    <p>${formatDate(startDate)}</p>
                                </div>
                                <div>
                                    <h4>End Date</h4>
                                    <p>${formatDate(endDate)}</p>
                                </div>
                            </div>
                        `;
                        grid.insertAdjacentHTML('afterbegin', datesSectionHTML);
                    }
                }
            } else if (!isMobile && datesSection) {
                // Remove dates section if on desktop
                datesSection.remove();
            }
        });
    }
});

// Add this function to calculate event status
function getEventStatus(startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for date comparison
    
    const eventDate = new Date(startDate);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate > today) {
        return "upcoming";
    } else if (eventDate.getTime() === today.getTime()) {
        return "today";
    } else {
        return "completed";
    }
}

// Update the saveEvent function to use inline errors
async function saveEvent(form) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            showError(form.querySelector('#eventTitle'), 'User not authenticated');
            return;
        }

        // Get form data
        const formData = new FormData(form);
        
        // Get and validate fields
        const title = form.querySelector('#eventTitle');
        const startDate = form.querySelector('#startDate');
        const endDate = form.querySelector('#endDate');
        const location = form.querySelector('#eventLocation');

        // Clear any existing errors
        [title, startDate, endDate, location].forEach(clearError);

        // Validate all fields
        let isValid = true;

        if (!title.value.trim()) {
            showError(title, 'Title is required');
            isValid = false;
        }

        if (!startDate.value) {
            showError(startDate, 'Start date is required');
            isValid = false;
        }

        if (!endDate.value) {
            showError(endDate, 'End date is required');
            isValid = false;
        } else if (new Date(endDate.value) < new Date(startDate.value)) {
            showError(endDate, 'End date must be after start date');
            isValid = false;
        }

        if (!location.value.trim()) {
            showError(location, 'Location is required');
            isValid = false;
        }

        if (!isValid) return;

        // Create event object
        const eventData = {
            title: title.value.trim(),
            description: formData.get('description')?.trim() || '',
            location: location.value.trim(),
            startDate: startDate.value,
            endDate: endDate.value,
            createdBy: {
                userId: user.uid,
                email: user.email
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            invitees: Array.from(form.querySelectorAll('.invitee-checkbox:checked'))
                .map(checkbox => checkbox.value)
        };

        console.log('Creating new event:', eventData);

        // Save to events collection
        const eventRef = await db.collection('events').add(eventData);
        console.log('Created event in events collection:', eventRef.id);

        // Save to public_events collection
        await db.collection('public_events').doc(eventRef.id).set({
            ...eventData,
            eventId: eventRef.id,
            availability: [], // Initialize empty availability array
            responses: {}    // Initialize empty responses object
        });
        console.log('Created event in public_events collection:', eventRef.id);

        // Close modal and refresh events
        const modal = document.getElementById('newEventModal');
        if (modal) modal.style.display = 'none';
        await loadAndDisplayEvents();

    } catch (error) {
        console.error('Error saving event:', error);
        showError(form.querySelector('#eventTitle'), error.message || 'Error saving event. Please try again.');
    }
}

// Add validation helper functions
function showError(input, message) {
    const container = input.closest('.input-container');
    if (!container) return;

    // Add invalid class to the input
    input.classList.add('invalid');
    input.classList.remove('valid');
    
    // For flatpickr inputs, find and update the visible input
    if (input.id === 'startDate' || input.id === 'endDate') {
        const visibleInput = container.querySelector('input[type="text"].form-control');
        if (visibleInput) {
            visibleInput.classList.add('invalid');
            visibleInput.classList.remove('valid');
        }
    }
    
    // Find or create error message element
    let errorElement = container.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        container.appendChild(errorElement);
    }
    
    // Set error message
    errorElement.textContent = message;
}

function clearError(input) {
    const container = input.closest('.input-container');
    if (!container) return;

    input.classList.remove('invalid');
    
    // For flatpickr inputs, find and update the visible input
    if (input.id === 'startDate' || input.id === 'endDate') {
        const visibleInput = container.querySelector('input[type="text"].form-control');
        if (visibleInput) {
            visibleInput.classList.remove('invalid');
        }
    }
    
    const errorElement = container.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

function setValid(input) {
    const container = input.closest('.input-container');
    if (!container) return;

    input.classList.remove('invalid');
    input.classList.add('valid');
    
    // For flatpickr inputs, find and update the visible input
    if (input.id === 'startDate' || input.id === 'endDate') {
        const visibleInput = container.querySelector('input[type="text"].form-control');
        if (visibleInput) {
            visibleInput.classList.remove('invalid');
            visibleInput.classList.add('valid');
        }
    }
    
    const errorElement = container.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Add field validation functions
function validateField(input) {
    switch (input.id) {
        case 'eventTitle':
            if (!input.value.trim()) {
                showError(input, 'Title is required');
                return false;
            }
            setValid(input);
            return true;

        case 'eventLocation':
            if (!input.value.trim()) {
                showError(input, 'Location is required');
                return false;
            }
            setValid(input);
            return true;

        case 'startDate':
            if (!input.value) {
                showError(input, 'Start date is required');
                return false;
            }
            setValid(input);
            return true;

        case 'endDate':
            if (!input.value) {
                showError(input, 'End date is required');
                return false;
            }
            const startDate = document.querySelector('#startDate');
            if (startDate && new Date(input.value) < new Date(startDate.value)) {
                showError(input, 'End date must be after start date');
                return false;
            }
            setValid(input);
            return true;

        default:
            return true;
    }
}

// Add helper functions for edit and delete
async function editEvent(eventId) {
    // Load event data
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
        alert('Event not found');
        return;
    }

    const event = eventDoc.data();
    
    // Populate modal with event data
    const modal = document.getElementById('newEventModal');
    const form = modal.querySelector('form');
    
    form.querySelector('#eventTitle').value = event.title;
    form.querySelector('#eventDescription').value = event.description || '';
    form.querySelector('#startDate').value = event.startDate;
    form.querySelector('#endDate').value = event.endDate;
    form.querySelector('#eventLocation').value = event.location;

    // Update modal title and button
    modal.querySelector('.modal-header h2').textContent = 'Edit Event';
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Save Changes';
    
    // Store event ID in form
    form.dataset.eventId = eventId;
    
    // Show modal
    modal.style.display = 'block';
}

async function confirmDeleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        try {
            await db.collection('events').doc(eventId).delete();
            await loadAndDisplayEvents(); // Refresh the table
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Error deleting event. Please try again.');
        }
    }
}

// Add this function to handle event button listeners
function addEventButtonListeners(container) {
    // View button listeners
    container.querySelectorAll('.view-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event row expansion
            const eventId = button.getAttribute('data-id');
            window.open(`event.html?id=${eventId}`, '_blank');
        });
    });

    // Edit button listeners
    container.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event row expansion
            const eventId = button.getAttribute('data-id');
            editEvent(eventId);
        });
    });

    // Delete button listeners
    container.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event row expansion
            const eventId = button.getAttribute('data-id');
            confirmDeleteEvent(eventId);
        });
    });
}

// Make sure it's available globally
window.addEventButtonListeners = addEventButtonListeners;

// Add this function to calculate response count
function calculateResponseCount(event) {
    if (!event.invitees || !Array.isArray(event.invitees)) {
        return 0;
    }
    return event.invitees.length;
}

// Add showNewEventModal function
window.showNewEventModal = function() {
    const modal = document.getElementById('newEventModal');
    if (!modal) return;

    // Reset form if exists
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
        // Clear validation states
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.classList.remove('invalid', 'valid');
            const container = input.closest('.input-container');
            if (container) {
                const errorMessage = container.querySelector('.error-message');
                if (errorMessage) {
                    errorMessage.textContent = '';
                }
            }
        });
    }

    // Initialize modal handlers
    const closeButton = modal.querySelector('.close-button');
    const cancelButton = modal.querySelector('.button.secondary');

    // Close button handler
    if (closeButton) {
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Cancel button handler
    if (cancelButton) {
        cancelButton.onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Click outside modal handler
    modal.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Show modal
    modal.style.display = 'block';
}; 