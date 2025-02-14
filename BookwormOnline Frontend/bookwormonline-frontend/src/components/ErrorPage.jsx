import React from 'react';
import { Link } from 'react-router-dom';

const ErrorPage = () => {
    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>404 - Page Not Found</h1>
            <p style={styles.message}>Sorry, the page you are looking for does not exist.</p>
            <Link to="/" style={styles.link}>Go back to Home</Link>
        </div>
    );
};

const styles = {
    container: {
        textAlign: 'center',
        marginTop: '50px',
    },
    heading: {
        fontSize: '2em',
        color: '#333',
    },
    message: {
        fontSize: '1.2em',
        color: '#666',
    },
    link: {
        fontSize: '1em',
        color: '#007bff',
        textDecoration: 'none',
    },
};

export default ErrorPage;