/*global WildRydes _config AmazonCognitoIdentity AWSCognito*/

// 비밀번호 토글 버튼 기능
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

togglePasswordButtons.forEach((button) => {
  button.addEventListener('click', (e) => {
    e.preventDefault(); // 클릭 기본 동작 방지
    const input = button.previousElementSibling; // 비밀번호 입력 필드
    const icon = button.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
});

// 비밀번호 확인 로직
const passwordField = document.querySelector('#passwordInputRegister');
const confirmPasswordField = document.querySelector('#password2InputRegister');
const passwordMatchMessage = document.querySelector('#password-match-message');

confirmPasswordField.addEventListener('input', () => {
  if (confirmPasswordField.value === '') {
    passwordMatchMessage.textContent = '';
    passwordMatchMessage.classList.remove('visible');
  } else if (passwordField.value === confirmPasswordField.value) {
    passwordMatchMessage.textContent = '비밀번호가 일치합니다.';
    passwordMatchMessage.style.color = 'green';
    passwordMatchMessage.classList.add('visible');
  } else {
    passwordMatchMessage.textContent = '비밀번호가 일치하지 않습니다.';
    passwordMatchMessage.style.color = 'red';
    passwordMatchMessage.classList.add('visible');
  }
});

// 비밀번호 요구사항 로직
  function showTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'block';
  }

  function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none';
  }
  
  function validatePassword() {
    const password = document.getElementById('passwordInputRegister').value;
    let score = 0;
  
    // 요구사항 검증
    const length = password.length >= 8;
    const number = /\d/.test(password);
    const uppercase = /[A-Z]/.test(password);
    const lowercase = /[a-z]/.test(password);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
    // 요구사항 업데이트
    updateRequirement('length', length);
    updateRequirement('number', number);
    updateRequirement('uppercase', uppercase);
    updateRequirement('lowercase', lowercase);
    updateRequirement('special', special);
  
    // 점수 계산
    score = [length, number, uppercase, lowercase, special].filter(Boolean).length * 20;
    updateStrength(score);
  }
  
  function updateRequirement(id, isValid) {
    const element = document.getElementById(id);
    const icon = element.querySelector('.icon');
  
    if (isValid) {
      element.classList.add('valid');
      element.classList.remove('invalid');
      icon.textContent = '✔'; // 체크 표시
    } else {
      element.classList.add('invalid');
      element.classList.remove('valid');
      icon.textContent = '•'; // 기본 점
    }
  }
  
  function updateStrength(score) {
    const progress = document.getElementById('progress');
    const strengthScore = document.getElementById('strength-score');
  
    progress.style.width = `${score}%`;
    strengthScore.textContent = `${score}%`;
  
    if (score < 40) {
      progress.style.background = 'red';
    } else if (score < 80) {
      progress.style.background = 'orange';
    } else {
      progress.style.background = 'green';
    }
  }

// 이메일 유효성 검증 로직
const emailField = document.querySelector('#emailInputRegister');
const emailErrorMessage = document.querySelector('#email-error-message');

emailField.addEventListener('input', () => {
    const email = emailField.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 이메일 정규식

    if (email === '') {
        emailErrorMessage.textContent = '';
        emailErrorMessage.classList.remove('visible');
    } else if (!emailPattern.test(email)) {
        emailErrorMessage.textContent = '기본 이메일 주소로 사용할 유효한 이메일 주소를 입력하십시오.';
        emailErrorMessage.classList.add('visible');
    } else {
        emailErrorMessage.textContent = '';
        emailErrorMessage.classList.remove('visible');
    }
});

var WildRydes = window.WildRydes || {};

(function scopeWrapper($) {
    var signinUrl = '/signin.html';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
          _config.cognito.userPoolClientId &&
          _config.cognito.region)) {
        $('#noCognitoMessage').show();
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    // 로그아웃 기능 수정
    WildRydes.signOut = function signOut() {
        userPool.getCurrentUser().signOut();
        sessionStorage.removeItem('authToken'); // 세션 스토리지에서 토큰 제거
    };

    /*// 세션 확인 및 자동 리다이렉션
    $(document).ready(function () {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function (err, session) {
                if (err || !session.isValid()) {
                    console.log('Invalid or expired session.');
                    sessionStorage.removeItem('authToken');
                    return; // 세션이 없거나 만료된 경우 아무 동작도 하지 않음
                }

                // 세션이 유효한 경우
                console.log('User is already signed in. Redirecting...');
                window.location.href = studentUrl; // student.html로 이동
            });
        } else {
            console.log('No user is signed in.');
        }
    });*/

    // authToken을 세션 스토리지에서 관리
    WildRydes.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    sessionStorage.removeItem('authToken'); // 만료된 세션일 경우 제거
                    resolve(null);
                } else {
                    var token = session.getIdToken().getJwtToken();
                    sessionStorage.setItem('authToken', token); // 세션 스토리지에 저장
                    resolve(token);
                }
            });
        } else {
            resolve(null);
        }
    });

    /*
     * Cognito User Pool functions
     */
    function register(email, password, username, employeeId, onSuccess, onFailure) {
        var dataEmail = { Name: 'email', Value: email };
        var dataCustomUsername = { Name: 'custom:username', Value: username }; // custom:username 속성 추가
        var dataEmployeeId = { Name: 'custom:employeeId', Value: employeeId }; // 사용자 정의 속성 추가
    
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
        var attributeCustomUsername = new AmazonCognitoIdentity.CognitoUserAttribute(dataCustomUsername);
        var attributeEmployeeId = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmployeeId);
    
        var dataRole = null;
        if (employeeId.length === 9) dataRole = { Name: 'custom:role', Value: "student" };
        else if (employeeId.length === 5) dataRole = { Name: 'custom:role', Value: "admin" };
    
        var attributeRole = new AmazonCognitoIdentity.CognitoUserAttribute(dataRole);
    
        // Username을 이메일 기반으로 설정
        userPool.signUp(
            toUsername(email), // Cognito username은 이메일 기반으로 설정
            password,
            [attributeEmail, attributeCustomUsername, attributeRole, attributeEmployeeId],
            null,
            function signUpCallback(err, result) {
                if (!err) {
                    onSuccess(result);
                } else {
                    onFailure(err);
                }
            }
        );
    }

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: toUsername(email),
            Password: password
        });

        var cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function authenticateSuccess(result) {
                console.log('Authentication successful');
                var token = result.getIdToken().getJwtToken();
                sessionStorage.setItem('authToken', token); // 세션 스토리지에 토큰 저장
                onSuccess(cognitoUser);
            },
            onFailure: onFailure
        });
    }

    function verify(email, code, onSuccess, onFailure) {
        createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
            if (!err) {
                onSuccess(result);
            } else {
                onFailure(err);
            }
        });
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: toUsername(email),
            Pool: userPool
        });
    }

    function toUsername(email) {
        return email.replace('@', '-at-');
    }

    /*
     *  Event Handlers
     */
    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);
        $('#registrationForm').submit(handleRegister);
        $('#verifyForm').submit(handleVerify);
    });
    
    function handleSignin(event) {
        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();
        var errorMessageDiv = $('#errorMessage'); // 오류 메시지를 보여줄 div
        event.preventDefault();
    
        signin(email, password,
            function signinSuccess(cognitoUser) {
                cognitoUser.getSession(function (err, session) {
                    if (err) {
                        console.error('Error getting session:', err);
                        errorMessageDiv.text('Failed to retrieve session: ' + err.message).show();
                        return;
                    }
    
                    cognitoUser.getUserAttributes(function (err, attributes) {
                        if (err) {
                            console.error('Error fetching user attributes:', err);
                            errorMessageDiv.text('Failed to fetch user attributes: ' + err.message).show();
                            return;
                        }
    
                        var storedRole = null;
                        attributes.forEach(function (attribute) {
                            if (attribute.getName() === 'custom:role') {
                                storedRole = attribute.getValue();
                            }
                        });
    
                        if (storedRole === 'admin') {
                            window.location.href = 'admin.html';
                        } else if (storedRole === 'student') {
                            window.location.href = 'student.html';
                        }
                    });
                });
            },
            function signinError(err) {
                console.error('Sign-in failed:', err);
                errorMessageDiv.text('Sign-in failed: ' + err.message).show();
            }
        );
    }
    function handleRegister(event) {
        var email = $('#emailInputRegister').val();
        var password = $('#passwordInputRegister').val();
        var password2 = $('#password2InputRegister').val();
        var username = $('#usernameInputRegister').val(); // 사용자 이름
        var employeeId = $('#employeeIDInputRegister').val(); // Role 값 가져오기
    
        var onSuccess = function registerSuccess(result) {
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
            var confirmation = ('Registration successful. Please check your email inbox or spam folder for your verification code.');
            if (confirmation) {
                window.location.href = 'verify.html';
            }
        };
    
        var onFailure = function registerFailure(err) {
            alert(err);
        };
    
        event.preventDefault();
    
        if (password === password2) {
            register(email, password, username, employeeId, onSuccess, onFailure); // Username 전달
        } else {
            alert('Passwords do not match');
        }
    }
    
    

    function handleVerify(event) {
        var email = $('#emailInputVerify').val();
        var code = $('#codeInputVerify').val();
        event.preventDefault();
        verify(email, code,
            function verifySuccess(result) {
                alert('Verification successful. You will now be redirected to the login page.');
                window.location.href = signinUrl;
            },
            function verifyError(err) {
                alert(err);
            }
        );
    }

    // 창 닫을 때 로그아웃 처리
    window.onbeforeunload = function () {
        sessionStorage.removeItem('authToken');
    };
}(jQuery));