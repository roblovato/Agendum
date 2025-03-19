// Update header component to only show events
export function createHeader(onNavigate) {
    const header = document.createElement('header');
    header.className = 'main-header';

    // Create left section with logo
    const leftSection = document.createElement('div');
    leftSection.className = 'header-left';

    // Add the app title/logo
    const logo = document.createElement('div');
    logo.className = 'logo';
    logo.textContent = 'Agendum';
    leftSection.appendChild(logo);

    // Create navigation buttons
    const navButtons = document.createElement('div');
    navButtons.className = 'nav-buttons';

    const newEventButton = document.createElement('button');
    newEventButton.className = 'nav-button primary event-button';
    newEventButton.innerHTML = '<span class="icon new-event-icon">+</span> <span class="text">New Event</span>';
    newEventButton.onclick = () => {
        window.showNewEventModal();
    };

    navButtons.appendChild(newEventButton);
    leftSection.appendChild(navButtons);
    header.appendChild(leftSection);

    // Add user navigation
    header.appendChild(createUserNav());

    return header;
}

// Update user navigation component to return an element instead of a string
export function createUserNav(user) {
    const userNav = document.createElement('div');
    userNav.className = 'user-nav';

    const userName = document.createElement('span');
    userName.className = 'user-name';
    userName.textContent = user?.email || 'Loading...';

    const logoutButton = document.createElement('button');
    logoutButton.className = 'logout-button';
    logoutButton.textContent = 'Logout';
    logoutButton.onclick = () => {
        firebase.auth().signOut().then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        });
    };

    userNav.appendChild(userName);
    userNav.appendChild(logoutButton);

    // Update username when auth state changes
    firebase.auth().onAuthStateChanged(currentUser => {
        if (currentUser) {
            userName.textContent = currentUser.email;
        }
    });

    return userNav;
}

// Update createLoadingOverlay function
export function createLoadingOverlay() {
    return `
        <div class="loading-overlay">
            <div class="loading-spinner"></div>
            <div class="loading-message">Loading...</div>
        </div>
    `;
}

// Firebase scripts component
export const createFirebaseScripts = () => `
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
    <script src="scripts/firebase-config.js"></script>
    <script type="module" src="scripts/scripts.js"></script>
`;

// Add these new components for auth pages
export const createAuthContainer = (title, formContent, linkText) => `
    <div class="container signup-container">
        <h1 class="signup-title">${title}</h1>
        ${formContent}
        ${linkText}
    </div>
`;

export const createAuthScripts = () => `
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
    <script src="scripts/firebase-config.js"></script>
    <script type="module" src="scripts/scripts.js"></script>
`;

export function createModal(title, content) {
    return `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-button" onclick="this.closest('.modal').classList.remove('show')">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="form-actions">
                <button class="button primary">Save</button>
                <button class="button secondary modal-cancel">Cancel</button>
            </div>
        </div>
    `;
}