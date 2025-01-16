// Header component
export const createHeader = (title) => `
    <header class="dashboard-header">
        <h1>${title}</h1>
        <div class="header-actions">
            <input type="text" placeholder="Search..." class="search-input">
            <select class="filter-select">
                <option value="all">All ${title}</option>
                <option value="recent">Recently Added</option>
                <option value="frequent">Frequently Contacted</option>
            </select>
        </div>
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
            <a href="dashboard.html" class="nav-button ${activeButton === 'events' ? 'active' : ''}">
                <span class="icon">📅</span>
                Events
            </a>
            <a href="contacts.html" class="nav-button ${activeButton === 'contacts' ? 'active' : ''}">
                <span class="icon">👥</span>
                Contacts
            </a>
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

// Add calendar component
export const createCalendar = () => `
    <div class="user-controls">
        <h3>Select User:</h3>
        <button class="user-button active" style="background-color: rgba(255, 0, 0, 0.8)" onclick="selectUser('user1')">User 1</button>
        <button class="user-button" style="background-color: rgba(0, 0, 255, 0.8)" onclick="selectUser('user2')">User 2</button>
        <button class="user-button" style="background-color: rgba(0, 255, 0, 0.8)" onclick="selectUser('user3')">User 3</button>
    </div>

    <div class="calendar">
        <div class="month-header">
            <button onclick="previousMonth()">&lt; Previous</button>
            <h2 id="monthYear"></h2>
            <button onclick="nextMonth()">Next &gt;</button>
        </div>
        <div class="calendar-grid">
            <div class="weekday-header">Sun</div>
            <div class="weekday-header">Mon</div>
            <div class="weekday-header">Tue</div>
            <div class="weekday-header">Wed</div>
            <div class="weekday-header">Thu</div>
            <div class="weekday-header">Fri</div>
            <div class="weekday-header">Sat</div>
        </div>
    </div>

    <div class="available-dates">
        <h2>Available Dates</h2>
        <ul class="date-list" id="dateList"></ul>
    </div>
`; 