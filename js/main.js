import awsconfig from './aws-exports'; // Cognito 설정 파일

Amplify.configure(awsconfig);

// Amplify 및 Auth 구성하기
Amplify.configure({
  Auth: {
    region: 'YOUR_COGNITO_REGION',
    userPoolId: 'YOUR_USER_POOL_ID',
    userPoolWebClientId: 'YOUR_USER_POOL_CLIENT_ID',
  }
});

// 로그인 로직
document.getElementById('loginForm').onsubmit = async function (event) {
  event.preventDefault();

  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;

  try {
    const user = await Amplify.Auth.signIn(email, password);
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
    alert('Login failed. Please try again.');
  }
};


// 회원가입 폼 처리
document.getElementById('signupForm').onsubmit = async function (event) {
  event.preventDefault();

  const email = document.getElementById('signupEmailInput').value;
  const password = document.getElementById('signupPasswordInput').value;
  const role = document.getElementById('roleSelect').value;

  if (!role) {
    alert('Please select a role.');
    return;
  }

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
  } catch (error) {
    console.error('Sign-up failed:', error);
    alert('Sign-up failed. Please try again.');
  }
};
