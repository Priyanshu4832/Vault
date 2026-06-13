const API = '/api';

console.log('auth.js loaded');
console.log('API:', API);

const loginForm = document.getElementById('login-wrapper');
const registerForm = document.getElementById('register-wrapper');
const loginLink = document.getElementById('to-login');
const registerLink = document.getElementById('to-register');

console.log('loginForm:', loginForm);
console.log('registerForm:', registerForm);

function toggleForm() {
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
}

loginLink.addEventListener('click', toggleForm);
registerLink.addEventListener('click', toggleForm);

if (localStorage.getItem('token')) {
    console.log('token found, redirecting to dashboard');
    window.location.href = 'dashboard.html';
}

async function handleLogin() {
    console.log('handleLogin called');
    const errorElement = document.getElementById('login-error');
    errorElement.classList.remove('show');

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    console.log('email:', email, 'password length:', password.length);

    if (!email || !password) {
        errorElement.textContent = 'Please fill in all fields.';
        errorElement.classList.add('show');
        return;
    }

    try {
        console.log('sending fetch to:', `${API}/auth/login`);

        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log('response status:', res.status);
        console.log('response ok:', res.ok);

        const text = await res.text();
        console.log('raw response text:', text);

        const data = JSON.parse(text);
        console.log('parsed data:', data);
        console.log('token:', data.token);

        if (res.ok) {
            localStorage.setItem('token', data.token);
            console.log('token stored:', localStorage.getItem('token'));
            window.location.href = 'dashboard.html';
        } else {
            errorElement.textContent = data.message || 'Login failed.';
            errorElement.classList.add('show');
        }

    } catch (err) {
        console.log('catch block hit:', err);
        console.log('error message:', err.message);
        errorElement.textContent = 'Something went wrong. Try again.';
        errorElement.classList.add('show');
    }
}

async function handleRegister() {
    console.log('handleRegister called');
    const errorElement = document.getElementById('register-error');
    errorElement.classList.remove('show');

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    console.log('name:', name, 'email:', email, 'password length:', password.length);

    if (!name || !email || !password) {
        errorElement.textContent = 'Please fill in all fields.';
        errorElement.classList.add('show');
        return;
    }

    try {
        console.log('sending fetch to:', `${API}/auth/register`);

        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        console.log('response status:', res.status);
        console.log('response ok:', res.ok);

        const text = await res.text();
        console.log('raw response text:', text);

        const data = JSON.parse(text);
        console.log('parsed data:', data);
        console.log('token:', data.token);

        if (res.ok) {
            localStorage.setItem('token', data.token);
            console.log('token stored:', localStorage.getItem('token'));
            window.location.href = 'dashboard.html';
        } else {
            errorElement.textContent = data.message || 'Register failed.';
            errorElement.classList.add('show');
        }

    } catch (err) {
        console.log('catch block hit:', err);
        console.log('error message:', err.message);
        errorElement.textContent = 'Something went wrong. Try again.';
        errorElement.classList.add('show');
    }
}

document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('register-btn').addEventListener('click', handleRegister);