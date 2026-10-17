import { formatDate } from './formatDate';

describe('formatDate', () => {
    // No Z suffix: the strings parse as local time, so the expected day holds in every time zone.
    it('formats ISO strings as DD/MM/YYYY', () => {
        expect(formatDate('2020-03-05T12:00:00')).toBe('05/03/2020');
        expect(formatDate('2021-12-31T12:00:00')).toBe('31/12/2021');
        expect(formatDate('2020-01-01T12:00:00')).toBe('01/01/2020');
    });

    it('handles the leap day', () => {
        expect(formatDate('2020-02-29T12:00:00')).toBe('29/02/2020');
    });

    it('accepts Date objects and timestamps', () => {
        const noon = new Date(2024, 6, 9, 12).getTime();
        expect(formatDate(new Date(noon))).toBe('09/07/2024');
        expect(formatDate(noon)).toBe('09/07/2024');
    });

    it('pads single digit days and months', () => {
        expect(formatDate('2019-09-03T12:00:00')).toBe('03/09/2019');
    });

    it('returns an empty string for missing or invalid input', () => {
        expect(formatDate(undefined)).toBe('');
        expect(formatDate(null)).toBe('');
        expect(formatDate('')).toBe('');
        expect(formatDate('not a date')).toBe('');
        expect(formatDate(new Date('nope'))).toBe('');
    });
});
