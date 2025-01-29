// Calendar state
let currentDate = new Date();
let eventData = null;
let selectedDates = new Set();

// Add state for all submissions
let allAvailabilities = [];

// Add color palette for submitter names
const colorPalette = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f1c40f', // Yellow
    '#9b59b6', // Purple
    '#e67e22', // Orange
    '#1abc9c', // Turquoise
    '#34495e', // Navy
    '#d35400', // Dark Orange
    '#27ae60', // Emerald
    '#8e44ad', // Violet
    '#2980b9', // Dark Blue
];

// Add submitter color mapping
let submitterColors = new Map();

// Calendar functions
export async function initializeCalendar(eventId) {
    try {
        // Make sure Firebase is initialized
        if (!firebase.apps.length) {
            throw new Error('Firebase not initialized');
        }

        // Get Firestore instance
        const db = firebase.firestore();
        
        // Fetch event data
        const doc = await db.collection('events').doc(eventId).get();
        if (!doc.exists) {
            throw new Error('Event not found');
        }

        eventData = {
            id: doc.id,
            ...doc.data()
        };
        
        // Log event details
        console.log('Event Details:', {
            id: eventData.id,
            title: eventData.title,
            description: eventData.description,
            dateType: eventData.dateType,
            date: eventData.date,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            location: eventData.location,
            createdBy: eventData.createdBy,
            invitees: eventData.invitees,
            createdAt: eventData.createdAt?.toDate(),
            updatedAt: eventData.updatedAt?.toDate(),
            rawData: eventData // Full raw data object
        });
        
        // Set current date to event date
        if (eventData.dateType === 'single') {
            currentDate = new Date(eventData.date);
        } else {
            currentDate = new Date(eventData.startDate);
        }

        // Add save button
        addSaveButton();
        
        // Load existing selections if user is authenticated
        const user = firebase.auth().currentUser;
        if (user) {
            const availabilityDoc = await db.collection('events')
                .doc(eventId)
                .collection('availability')
                .doc(user.uid)
                .get();
            
            if (availabilityDoc.exists) {
                selectedDates = new Set(availabilityDoc.data().dates);
            }
        }

        // Load all availability submissions
        const availabilitySnapshot = await db.collection('events')
            .doc(eventId)
            .collection('availability')
            .get();
        
        allAvailabilities = availabilitySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));

        // Initialize calendar
        renderCalendar();
        initializeEventListeners();
    } catch (error) {
        console.error('Error loading event:', error);
        document.body.innerHTML = `<div class="error">Error loading event: ${error.message}</div>`;
    }
}

function initializeEventListeners() {
    // Month navigation
    document.querySelector('.prev-month')?.addEventListener('click', previousMonth);
    document.querySelector('.next-month')?.addEventListener('click', nextMonth);
}

export function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

export function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

export function renderCalendar() {
    const monthYear = document.getElementById('monthYear');
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!monthYear || !calendarGrid || !eventData) return;
    
    // Set month and year
    monthYear.textContent = currentDate.toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
    });

    // Clear existing days
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

    // Reset submitter colors
    submitterColors = new Map();
    let colorIndex = 0;

    // Assign colors to submitters
    allAvailabilities.forEach(submission => {
        if (!submitterColors.has(submission.submitterId)) {
            submitterColors.set(
                submission.submitterId, 
                colorPalette[colorIndex % colorPalette.length]
            );
            colorIndex++;
        }
    });

    // Add days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        
        const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        dayElement.appendChild(dateNumber);

        // Check if this day is selected in current session
        if (selectedDates.has(dateString)) {
            dayElement.classList.add('selected');
        }

        // Add click handler for date selection
        dayElement.addEventListener('click', () => toggleDateSelection(dateString, dayElement));

        // Show event info
        const eventInfo = getEventInfo(dateString);
        if (eventInfo.hasEvent) {
            dayElement.classList.add('has-event');
            if (eventInfo.showTitle) {
                const eventTitle = document.createElement('div');
                eventTitle.className = 'event-title';
                eventTitle.textContent = eventData.title;
                eventTitle.addEventListener('mouseover', (e) => showEventTooltip(e.target));
                eventTitle.addEventListener('mouseout', hideEventTooltip);
                dayElement.appendChild(eventTitle);
            }
        }

        // Show all availabilities for this date
        const availableSubmitters = allAvailabilities.filter(a => 
            a.dates.includes(dateString)
        );

        if (availableSubmitters.length > 0) {
            dayElement.classList.add('has-availability');
            
            const availabilityContainer = document.createElement('div');
            availabilityContainer.className = 'availability-names';
            
            availableSubmitters.forEach(submitter => {
                const nameTag = document.createElement('div');
                nameTag.className = 'availability-name';
                nameTag.textContent = submitter.submitterName;
                nameTag.style.backgroundColor = submitterColors.get(submitter.submitterId);
                // Add hover effect to show full name
                nameTag.title = submitter.submitterName;
                availabilityContainer.appendChild(nameTag);
            });

            dayElement.appendChild(availabilityContainer);
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

// Add function to determine event info for a specific date
function getEventInfo(dateString) {
    if (eventData.dateType === 'single') {
        return {
            hasEvent: dateString === eventData.date,
            showTitle: dateString === eventData.date
        };
    } else {
        const date = new Date(dateString);
        const start = new Date(eventData.startDate);
        const end = new Date(eventData.endDate);
        return {
            hasEvent: date >= start && date <= end,
            showTitle: dateString === eventData.startDate
        };
    }
}

// Update tooltip functions
function showEventTooltip(element) {
    const tooltip = document.getElementById('eventTooltip');
    if (!tooltip || !eventData) return;

    tooltip.innerHTML = `
        <div class="tooltip-content">
            <h3>${eventData.title}</h3>
            ${eventData.description ? `<p>${eventData.description}</p>` : ''}
            ${eventData.location ? `<p><strong>Location:</strong> ${eventData.location}</p>` : ''}
        </div>
    `;

    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.display = 'block';
}

function hideEventTooltip() {
    const tooltip = document.getElementById('eventTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// Add date selection toggle
function toggleDateSelection(dateString, element) {
    if (selectedDates.has(dateString)) {
        selectedDates.delete(dateString);
        element.classList.remove('selected');
    } else {
        selectedDates.add(dateString);
        element.classList.add('selected');
    }
    updateSaveButton();
}

// Add save button functionality
function addSaveButton() {
    const container = document.createElement('div');
    container.className = 'save-selections-container';
    
    // Add name input field
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter your name';
    nameInput.className = 'submitter-name-input';
    nameInput.required = true;
    
    const button = document.createElement('button');
    button.className = 'save-selections-button';
    button.textContent = 'Submit Available Dates';
    button.style.display = 'none';
    button.addEventListener('click', () => {
        if (!nameInput.value.trim()) {
            alert('Please enter your name');
            nameInput.focus();
            return;
        }
        saveSelectedDates(nameInput.value.trim());
    });
    
    container.appendChild(nameInput);
    container.appendChild(button);
    document.querySelector('.calendar').appendChild(container);
    return { button, nameInput };
}

// Update save button visibility
function updateSaveButton() {
    const button = document.querySelector('.save-selections-button');
    if (button) {
        button.style.display = selectedDates.size > 0 ? 'block' : 'none';
    }
}

// Update saveSelectedDates to refresh the calendar with new submission
async function saveSelectedDates(submitterName) {
    try {
        if (selectedDates.size === 0) {
            alert('Please select at least one date');
            return;
        }

        // Generate a random submitter ID
        const submitterId = 'anon_' + Math.random().toString(36).substr(2, 9);

        const availabilityData = {
            submitterId: submitterId,
            submitterName: submitterName,
            dates: Array.from(selectedDates),
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to subcollection
        await db.collection('events').doc(eventData.id)
            .collection('availability')
            .doc(submitterId)
            .set(availabilityData);

        alert('Your availability has been saved!');
        
        // Add new submission to local state
        allAvailabilities.push({
            submitterId: submitterId,
            submitterName: submitterName,
            dates: Array.from(selectedDates),
            submittedAt: new Date()
        });

        // Clear selections and refresh
        selectedDates.clear();
        document.querySelector('.submitter-name-input').value = '';
        renderCalendar();
        updateSaveButton();

    } catch (error) {
        console.error('Error saving dates:', error);
        alert('Error saving dates. Please try again.');
    }
}

// Initialize calendar event listeners
document.addEventListener('DOMContentLoaded', () => {
    // User selection buttons
    document.querySelectorAll('.user-button').forEach(button => {
        button.addEventListener('click', () => selectUser(button.dataset.user));
    });

    // Month navigation
    document.querySelector('.prev-month')?.addEventListener('click', previousMonth);
    document.querySelector('.next-month')?.addEventListener('click', nextMonth);

    // Initial render
    if (document.querySelector('.calendar-grid')) {
        renderCalendar();
    }
}); 