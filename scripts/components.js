// Update header component to only show events
export function createHeader(onNavigate) {
    const header = document.createElement('header');
    header.className = 'main-header';

    // Create left section with logo
    const leftSection = document.createElement('div');
    leftSection.className = 'header-left';

    // Add logo
    const logo = document.createElement('div');
    logo.className = 'logo';
    logo.textContent = 'Agendum';
    leftSection.appendChild(logo);

    // Add navigation buttons (only Events now)
    const nav = document.createElement('nav');
    nav.className = 'main-nav';
    
    const newEventButton = document.createElement('button');
    newEventButton.className = 'nav-button primary';
    newEventButton.innerHTML = '+ New Event';
    newEventButton.onclick = () => {
        const modal = document.getElementById('newEventModal');
        if (modal) modal.style.display = 'block';
    };
    nav.appendChild(newEventButton);

    leftSection.appendChild(nav);
    header.appendChild(leftSection);

    // Add user nav to right side
    const userNav = createUserNav();
    userNav.className = 'header-right';
    header.appendChild(userNav);

    return header;
}

// Update styles for the new layout
const styles = `
    .main-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: #3498db;
    }

    .main-nav {
        display: flex;
        gap: 1rem;
    }

    .nav-button.primary {
        padding: 0.5rem 1rem;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.2s;
    }

    .nav-button.primary:hover {
        background: #2980b9;
        transform: translateY(-1px);
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .main-content {
        margin-top: 80px;
        padding: 2rem;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Update user navigation component to return an element instead of a string
export function createUserNav() {
    const userNav = document.createElement('div');
    userNav.className = 'user-nav';

    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';

    const userAvatar = document.createElement('div');
    userAvatar.className = 'user-avatar';

    const userName = document.createElement('span');
    userName.className = 'user-name';
    userName.textContent = 'Loading...';

    const logoutButton = document.createElement('button');
    logoutButton.className = 'logout-button';
    logoutButton.textContent = 'Logout';

    // Add logout functionality
    logoutButton.addEventListener('click', () => {
        firebase.auth().signOut()
            .then(() => {
                window.location.href = 'signin.html';
            })
            .catch((error) => {
                console.error('Error signing out:', error);
            });
    });

    // Assemble the components
    userInfo.appendChild(userAvatar);
    userInfo.appendChild(userName);
    userNav.appendChild(userInfo);
    userNav.appendChild(logoutButton);

    // Update username when auth state changes
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            userName.textContent = user.email;
        }
    });

    return userNav;
}

// Update styles for user nav
const userNavStyles = `
    .user-nav {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #ddd;
    }

    .user-name {
        color: #666;
    }

    .logout-button {
        padding: 0.5rem 1rem;
        border: none;
        background: #f8f9fa;
        color: #666;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .logout-button:hover {
        background: #e9ecef;
        color: #e74c3c;
    }
`;

// Add user nav styles to the document
const userNavStyleSheet = document.createElement('style');
userNavStyleSheet.textContent = userNavStyles;
document.head.appendChild(userNavStyleSheet);

// Update loading overlay component to return an element
export function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const text = document.createElement('div');
    text.className = 'loading-text';
    text.textContent = 'Loading...';
    
    overlay.appendChild(spinner);
    overlay.appendChild(text);
    
    return overlay;
}

// Add loading overlay styles if not already present
const loadingStyles = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: none;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: 1rem;
        z-index: 9999;
    }

    .loading-overlay.show {
        display: flex;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .loading-text {
        color: #666;
        font-size: 1.1em;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

// Add loading styles to document
const loadingStyleSheet = document.createElement('style');
loadingStyleSheet.textContent = loadingStyles;
document.head.appendChild(loadingStyleSheet);

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