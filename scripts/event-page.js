// Add formatDate function since it's used in loadEventDetails
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

async function loadEventDetails() {
    try {
        // Get event ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        
        if (!eventId) {
            throw new Error('No event ID provided');
        }

        // Wait for Firebase Auth to initialize
        await new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        // Use the existing Firebase instance
        const db = firebase.firestore();

        // Get event from public_events collection
        const doc = await db.collection('events').doc(eventId).get();
        
        if (!doc.exists) {
            // Try public_events collection as fallback
            const publicDoc = await db.collection('public_events').doc(eventId).get();
            if (!publicDoc.exists) {
                throw new Error('Event not found');
            }
            doc = publicDoc;
        }

        const event = doc.data();

        // Update page content
        const titleElement = document.getElementById('eventTitle');
        const descriptionElement = document.getElementById('eventDescription');
        const locationElement = document.getElementById('eventLocation');
        const dateElement = document.getElementById('eventDate');

        if (!titleElement || !descriptionElement || !locationElement || !dateElement) {
            throw new Error('Required DOM elements not found');
        }

        // Set content with fallbacks
        titleElement.textContent = event.title || 'Untitled Event';
        descriptionElement.textContent = event.description || 'No description provided';
        locationElement.textContent = event.location || 'No location specified';

        // Format and display date
        let dateDisplay = '';
        if (event.dateType === 'single' && event.date) {
            dateDisplay = formatDate(event.date);
        } else if (event.startDate && event.endDate) {
            dateDisplay = `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`;
        } else {
            dateDisplay = 'Date not specified';
        }
        dateElement.textContent = dateDisplay;

    } catch (error) {
        console.error('Error loading event:', error);
        
        // Show user-friendly error message on page
        const container = document.querySelector('.event-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h2>Error Loading Event</h2>
                    <p>${error.message || 'Unable to load event details. Please try again.'}</p>
                    <a href="dashboard.html" class="button secondary">Return to Dashboard</a>
                </div>
            `;
        }
    }
}

// Add CSS for error state
const style = document.createElement('style');
style.textContent = `
    .error-state {
        text-align: center;
        padding: 40px 20px;
    }
    .error-state h2 {
        color: #e74c3c;
        margin-bottom: 16px;
    }
    .error-state p {
        color: #666;
        margin-bottom: 24px;
    }
    .button.secondary {
        display: inline-block;
        padding: 10px 20px;
        background-color: #f8f9fa;
        color: #2c3e50;
        text-decoration: none;
        border-radius: 6px;
        transition: background-color 0.2s;
    }
    .button.secondary:hover {
        background-color: #e9ecef;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadEventDetails();
});