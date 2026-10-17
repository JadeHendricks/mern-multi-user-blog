// Created once: building an Intl.DateTimeFormat is far more expensive than calling format().
// en-GB with 2-digit day and month gives DD/MM/YYYY, the layout moment's 'DD/MM/YYYY' produced.
// Both format in the browser's local time zone (parity checked against moment, see FEAT-003).
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

/**
 * Formats an ISO string, timestamp or Date as DD/MM/YYYY.
 * Why '' for bad input: moment printed the text "Invalid date" on the page; an empty
 * string is quieter and Intl.format would throw a RangeError on an invalid Date.
 * @param {string | number | Date | null | undefined} value
 * @returns {string}
 */
export function formatDate(value) {
    if (value === null || value === undefined || value === '') return '';
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}
