import { render, screen } from '@testing-library/react';
import App from './App';

test('renders create election button', () => {
    render(<App />);
    const buttonElement = screen.getByText(/create new election/i);
    expect(buttonElement).toBeInTheDocument();
});
