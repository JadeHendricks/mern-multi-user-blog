import React from 'react';
import { render } from '@testing-library/react';
import Moment from 'react-moment';

// Guards the moment alias in vite.config.mjs: react-moment crashed on import (blank page) when
// Vite handed it moment's ESM build instead of the CommonJS one.
describe('react-moment', () => {
    it('formats a date', () => {
        const { container } = render(<Moment format="DD/MM/YYYY">{ '2020-03-05T12:00:00Z' }</Moment>);
        expect(container.textContent).toBe('05/03/2020');
    });
});
