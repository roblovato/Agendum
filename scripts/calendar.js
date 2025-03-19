// Add formatDate function at the top with other utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

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

// Add state for date boundaries
let minDate = null;
let maxDate = null;

// Add state to track if user has submitted
let hasSubmitted = false;

// Calendar functions
export async function initializeCalendar() {
    try {
        // Get event ID from URL
        const params = new URLSearchParams(window.location.search);
        const eventId = params.get('id');
        
        if (!eventId) {
            throw new Error('No event ID specified');
        }

        // Show loading state
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            calendarContainer.innerHTML = `
                <div class="loading-message" style="text-align: center; padding: 2rem;">
                    <h3>Loading Calendar...</h3>
                </div>
            `;
        }

        // Load the event (no auth required per rules)
        const eventDoc = await db.collection('events').doc(eventId).get();
        
        if (!eventDoc.exists) {
            throw new Error('Event not found');
        }

        // Set event data
        eventData = {
            id: eventDoc.id,
            ...eventDoc.data()
        };

        // Set date boundaries
        minDate = new Date(eventData.startDate);
        maxDate = new Date(eventData.endDate);
        currentDate = new Date(minDate);

        // Create calendar structure
        calendarContainer.innerHTML = `
            <div class="calendar">
                <div class="event-details">
                    <h1>${eventData.title}</h1>
                    <div class="event-info">
                        <p><strong>Location:</strong> ${eventData.location}</p>
                        <p><strong>Date:</strong> ${formatDate(eventData.startDate)} - ${formatDate(eventData.endDate)}</p>
                        ${eventData.description ? `<p><strong>Description:</strong> ${eventData.description}</p>` : ''}
                    </div>
                </div>
                <div class="calendar-header">
                    <button class="prev-month">&lt;</button>
                    <h2 id="monthYear"></h2>
                    <button class="next-month">&gt;</button>
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
        `;

        // Add the save button and name input
        const { button: saveButton, nameInput } = addSaveButton();

        // Load existing availabilities (no auth required per rules)
        try {
            const availabilitySnapshot = await db.collection('events')
                .doc(eventData.id)
                .collection('availability')
                .get();

            allAvailabilities = availabilitySnapshot.docs.map(doc => ({
                submitterId: doc.id,
                ...doc.data()
            }));

            // Check if current user has already submitted using localStorage
            const submissionKey = `event_${eventId}_submitted`;
            if (localStorage.getItem(submissionKey)) {
                hasSubmitted = true;
                if (saveButton) saveButton.style.display = 'none';
                if (nameInput) nameInput.disabled = true;
            }
        } catch (error) {
            console.error('Error loading availabilities:', error);
        }

        // Initialize event listeners
        initializeEventListeners();

        // Set initial dates
        const events = [];
        events.push({
            id: eventData.id,
            ...eventData
        });

        // Render calendar with events
        renderCalendar(events);

        // Update page title
        const eventTitle = document.querySelector('title');
        if (eventTitle) {
            eventTitle.textContent = `${eventData.title} - Agendum`;
        }

    } catch (error) {
        console.error('Error initializing calendar:', error);
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            calendarContainer.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 2rem;">
                    <h3>Error Loading Calendar</h3>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" class="button primary" style="margin-top: 1rem;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

function initializeEventListeners() {
    // Month navigation
    document.querySelector('.prev-month')?.addEventListener('click', previousMonth);
    document.querySelector('.next-month')?.addEventListener('click', nextMonth);
}

export function previousMonth() {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const minYearMonth = minDate.getFullYear() * 12 + minDate.getMonth();
    const newYearMonth = newDate.getFullYear() * 12 + newDate.getMonth();
    
    if (newYearMonth >= minYearMonth) {
        currentDate = newDate;
        renderCalendar();
    }
}

export function nextMonth() {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const maxYearMonth = maxDate.getFullYear() * 12 + maxDate.getMonth();
    const newYearMonth = newDate.getFullYear() * 12 + newDate.getMonth();
    
    if (newYearMonth <= maxYearMonth) {
        currentDate = newDate;
        renderCalendar();
    }
}

export function renderCalendar(events) {
    const monthYear = document.getElementById('monthYear');
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!monthYear || !calendarGrid || !eventData) return;
    
    // Update navigation button states
    const prevButton = document.querySelector('.prev-month');
    const nextButton = document.querySelector('.next-month');

    if (prevButton) {
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const minYearMonth = minDate.getFullYear() * 12 + minDate.getMonth();
        const prevYearMonth = prevMonth.getFullYear() * 12 + prevMonth.getMonth();
        const canGoPrev = prevYearMonth >= minYearMonth;
        
        prevButton.classList.toggle('disabled', !canGoPrev);
        prevButton.disabled = !canGoPrev;
    }

    if (nextButton) {
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const maxYearMonth = maxDate.getFullYear() * 12 + maxDate.getMonth();
        const nextYearMonth = nextMonth.getFullYear() * 12 + nextMonth.getMonth();
        const canGoNext = nextYearMonth <= maxYearMonth;
        
        nextButton.classList.toggle('disabled', !canGoNext);
        nextButton.disabled = !canGoNext;
    }

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
        const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        // Set base class
        dayElement.className = 'day';
        
        if (hasSubmitted) {
            dayElement.classList.add('disabled');
            dayElement.style.pointerEvents = 'none';
        } else {
            if (isDateInRange(dateString)) {
                dayElement.addEventListener('click', (e) => {
                    if (!hasSubmitted) {
                        toggleDateSelection(dateString, dayElement);
                    }
                });
            } else {
                dayElement.classList.add('disabled');
            }
        }

        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        dayElement.appendChild(dateNumber);

        // Show selected state if applicable
        if (!hasSubmitted && selectedDates.has(dateString)) {
            dayElement.classList.add('selected');
        }

        // Show event info - only once per date
        const date = new Date(dateString);
        const start = new Date(eventData.startDate);
        const end = new Date(eventData.endDate);
        
        if (date >= start && date <= end) {
            dayElement.classList.add('has-event');
            // Only show title on first day of event
            if (dateString === eventData.startDate) {
                const eventTitle = document.createElement('div');
                eventTitle.className = 'event-title';
                eventTitle.textContent = eventData.title;
                dayElement.appendChild(eventTitle);
            }
        }

        // Show availabilities for this date
        const availableSubmitters = allAvailabilities.filter(a => 
            a.dates.includes(dateString)
        );

        if (availableSubmitters.length > 0) {
            const availabilityContainer = document.createElement('div');
            availabilityContainer.className = 'availability-names';
            
            // Sort submitters by name for consistent display
            availableSubmitters
                .sort((a, b) => a.submitterName.localeCompare(b.submitterName))
                .forEach(submitter => {
                    const nameTag = document.createElement('div');
                    nameTag.className = 'availability-name';
                    nameTag.textContent = submitter.submitterName;
                    nameTag.style.backgroundColor = submitterColors.get(submitter.submitterId);
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

// Update isDateInRange function with more logging
function isDateInRange(dateString) {
    // console.log('Checking date range for:', dateString);
    
    // Parse dates consistently
    const checkDate = new Date(dateString);
    checkDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(minDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(maxDate);
    endDate.setHours(23, 59, 59, 999);
    
    const isInRange = checkDate >= startDate && checkDate <= endDate;
    
    // console.log({
    //     checkDate: checkDate.toISOString(),
    //     startDate: startDate.toISOString(),
    //     endDate: endDate.toISOString(),
    //     isInRange: isInRange
    // });
    
    return isInRange;
}

// Update toggleDateSelection function to check hasSubmitted state first
function toggleDateSelection(dateString, element) {
    console.log('Attempting to toggle date:', dateString);
    console.log('Element classes:', element.className);
    console.log('Has submitted:', hasSubmitted);
    
    // Check submission state first
    if (hasSubmitted) {
        console.log('Selection blocked: User has already submitted');
        return;
    }
    
    if (element.classList.contains('disabled')) {
        console.log('Blocked selection of disabled date:', dateString);
        return;
    }
    
    if (!isDateInRange(dateString)) {
        console.log('Blocked selection of out-of-range date:', dateString);
        return;
    }

    if (selectedDates.has(dateString)) {
        console.log('Removing date from selection:', dateString);
        selectedDates.delete(dateString);
        element.classList.remove('selected');
    } else {
        console.log('Adding date to selection:', dateString);
        selectedDates.add(dateString);
        element.classList.add('selected');
    }
    updateSaveButton();
}

// Update addSaveButton function to include error handling
function addSaveButton() {
    const container = document.createElement('div');
    container.className = 'save-selections-container';
    
    // Add name input container with error message
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter your name';
    nameInput.className = 'submitter-name-input';
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    
    inputContainer.appendChild(nameInput);
    inputContainer.appendChild(errorMessage);
    
    const button = document.createElement('button');
    button.className = 'save-selections-button';
    button.textContent = 'Submit Available Dates';
    button.style.display = 'none';
    
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Clear previous error
        clearError(nameInput);
        
        // Validate name
        if (!nameInput.value.trim()) {
            showError(nameInput, 'Please enter your name');
            return;
        }
        
        // Validate date selections
        if (selectedDates.size === 0) {
            showError(nameInput, 'Please select at least one date');
            return;
        }
        
        await saveSelectedDates(nameInput.value.trim());
    });
    
    // Add input validation on blur
    nameInput.addEventListener('blur', () => {
        if (!nameInput.value.trim()) {
            showError(nameInput, 'Please enter your name');
        } else {
            setValid(nameInput);
        }
    });
    
    // Clear error on input
    nameInput.addEventListener('input', () => {
        clearError(nameInput);
    });
    
    container.appendChild(inputContainer);
    container.appendChild(button);
    document.querySelector('.calendar').appendChild(container);
    return { button, nameInput };
}

// Add validation helper functions (same as in scripts.js)
function showError(input, message) {
    const container = input.closest('.input-container');
    if (!container) return;

    input.classList.add('invalid');
    input.classList.remove('valid');
    
    let errorElement = container.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        container.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function clearError(input) {
    const container = input.closest('.input-container');
    if (!container) return;

    input.classList.remove('invalid');
    
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
}

// Update save button visibility
function updateSaveButton() {
    const button = document.querySelector('.save-selections-button');
    if (button) {
        button.style.display = selectedDates.size > 0 ? 'block' : 'none';
    }
}

// Update saveSelectedDates function
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

        // Save to events subcollection (allowed by rules)
        await db.collection('events').doc(eventData.id)
            .collection('availability')
            .doc(submitterId)
            .set(availabilityData);

        // Save to public_events collection using update to preserve other responses
        await db.collection('public_events').doc(eventData.id).update({
            [`responses.${submitterName}`]: {
                dates: Array.from(selectedDates),
                submittedAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        }).catch(async (error) => {
            // If document doesn't exist, create it
            if (error.code === 'not-found') {
                await db.collection('public_events').doc(eventData.id).set({
                    responses: {
                        [submitterName]: {
                            dates: Array.from(selectedDates),
                            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }
                    }
                });
            } else {
                throw error;
            }
        });

        // Store submission in localStorage
        localStorage.setItem(`event_${eventData.id}_submitted`, 'true');

        // Add new submission to local state
        allAvailabilities.push({
            submitterId: submitterId,
            submitterName: submitterName,
            dates: Array.from(selectedDates),
            submittedAt: new Date()
        });

        // Show success modal
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.style.display = 'block';
            
            const closeSuccessModal = () => {
                successModal.style.display = 'none';
                
                // Set submitted state first
                hasSubmitted = true;
                
                // Clear selections
                selectedDates.clear();
                
                // Remove save container
                const saveContainer = document.querySelector('.save-selections-container');
                if (saveContainer) {
                    saveContainer.remove();
                }
                
                // Disable all day elements
                document.querySelectorAll('.day').forEach(day => {
                    day.classList.add('disabled');
                    day.style.pointerEvents = 'none';
                    day.classList.remove('selected');
                });
                
                // Re-render calendar
                renderCalendar();
                console.log('here', availabilityData);
            };
            
            // Handle OK button click
            const okButton = document.getElementById('successOkButton');
            if (okButton) {
                okButton.onclick = closeSuccessModal;
            }

            // Handle close button click
            const closeButton = successModal.querySelector('.close-button');
            if (closeButton) {
                closeButton.onclick = closeSuccessModal;
            }

            // Handle click outside modal
            window.onclick = (event) => {
                if (event.target === successModal) {
                    closeSuccessModal();
                }
            };
        }

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