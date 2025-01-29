// Header component
export const createHeader = (title) => `
    <header class="dashboard-header">
        <h1>${title}</h1>
    </header>
`;

// Sidebar component
export const createSidebar = (activeButton) => `
    <nav class="sidebar">
        <div class="logo">
            <h2>Agendum</h2>
        </div>
        <div class="nav-buttons">
            <button class="nav-button primary">
                <span class="icon">+</span>
                New ${activeButton === 'contacts' ? 'Contact' : 'Event'}
            </button>
            <button class="nav-button ${activeButton === 'events' ? 'active' : ''}" data-view="events">
                <span class="icon">📅</span>
                Events
            </button>
            <button class="nav-button ${activeButton === 'contacts' ? 'active' : ''}" data-view="contacts">
                <span class="icon">👥</span>
                Contacts
            </button>
        </div>
    </nav>
`;

// User navigation component
export const createUserNav = () => `
    <div class="user-nav">
        <div class="user-info">
            <div class="user-avatar"></div>
            <span class="user-name">Loading...</span>
        </div>
        <button class="logout-button">Logout</button>
    </div>
`;

// Loading overlay component
export const createLoadingOverlay = () => `
    <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
    </div>
`;

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