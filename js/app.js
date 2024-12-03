import Amplify, { Auth } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

document.getElementById('loginForm').onsubmit = async function (event) {
    event.preventDefault();
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    try {
        const user = await Auth.signIn(email, password);
        const userAttributes = user.signInUserSession.idToken.payload;
        const role = userAttributes['custom:role']; // 사용자 타입 확인

        console.log('User role:', role);

        if (role === 'student') {
            window.location.href = 'student.html';
        } else if (role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            alert('Invalid role');
        }
    } catch (err) {
        console.error('Login failed:', err);
        alert('Login failed');
    }
};
