import { register, login, verifyEmail } from './cognito-auth.js';

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    register(email, password);
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    login(email, password);
});

document.getElementById('verifyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('verifyEmail').value;
    const code = document.getElementById('verifyCode').value;
    verifyEmail(email, code);
});
