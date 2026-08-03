/**
 * Utility functions for time and date manipulation.
 */

/**
 * Converts a UTC date string and UTC time string into a localized time string.
 * @param {string} dateStr - Date string in format YYYY-MM-DD
 * @param {string} timeStr - Time string in format HH:mm:ss
 * @returns {string} - Formatted local time string (e.g. 11:30 AM)
 */
export const formatUTCtoLocal = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '-';
    
    try {
        // Construct standard ISO 8601 UTC string
        const isoStr = `${dateStr}T${timeStr}Z`;
        const d = new Date(isoStr);
        
        // Check for invalid date
        if (isNaN(d.getTime())) return timeStr;

        return d.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (e) {
        console.error("Error formatting time:", e);
        return timeStr;
    }
};

/**
 * Calculates the difference in hours and minutes between two UTC time strings.
 * @param {string} inTime - Start time in HH:mm:ss
 * @param {string} outTime - End time in HH:mm:ss
 * @returns {number} - Difference in minutes
 */
export const calculateDurationMinutes = (inTime, outTime) => {
    if (!inTime || !outTime) return 0;
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    
    if (!isNaN(inH) && !isNaN(outH)) {
        let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
        if (diffMins < 0) diffMins += 24 * 60; // Handle overnight shifts
        return diffMins;
    }
    return 0;
};
