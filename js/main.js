import Amplify, { Auth } from 'aws-amplify';
import awsconfig from './aws-exports'; // Cognito 설정 파일

Amplify.configure(awsconfig);

// 회원가입 처리
document.getElementById('signupForm')?.onsubmit = async function (event) {
    event.preventDefault();

    const email = document.getElementById('signupEmailInput').value;
    const password = document.getElementById('signupPasswordInput').value;
    const role = document.getElementById('roleSelect').value;

    try {
        await Auth.signUp({
            username: email,
            password: password,
            attributes: {
                email: email,
                'custom:role': role, // 사용자 정의 속성
            },
        });
        alert('Sign-up successful. Please check your email to confirm.');
        window.location.href = 'verify.html';
    } catch (error) {
        console.error('Sign-up failed:', error);
        document.getElementById('errorMessage').textContent = 'Sign-up failed: ' + error.message;
    }
};

// 로그인 처리
document.getElementById('signinForm')?.onsubmit = async function (event) {
    event.preventDefault();

    const email = document.getElementById('emailInputSignin').value;
    const password = document.getElementById('passwordInputSignin').value;

    try {
        const user = await Auth.signIn(email, password);
        const role = user.signInUserSession.idToken.payload['custom:role'];

        if (role === 'student') {
            window.location.href = 'student.html';
        } else if (role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            alert('Unknown role. Please contact support.');
        }
    } catch (error) {
        console.error('Login failed:', error);
        document.getElementById('errorMessage').textContent = 'Login failed: ' + error.message;
    }
};

// 이메일 인증 처리
document.getElementById('verifyForm')?.onsubmit = async function (event) {
    event.preventDefault();

    const email = document.getElementById('emailInputVerify').value;
    const code = document.getElementById('codeInputVerify').value;

    try {
        await Auth.confirmSignUp(email, code);
        alert('Verification successful. You can now sign in.');
        window.location.href = 'signin.html';
    } catch (error) {
        console.error('Verification failed:', error);
        document.getElementById('errorMessage').textContent = 'Verification failed: ' + error.message;
    }
};
