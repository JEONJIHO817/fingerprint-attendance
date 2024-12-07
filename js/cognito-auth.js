/*global WildRydes _config AmazonCognitoIdentity AWSCognito*/

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
    function register(email, password, employeeId, onSuccess, onFailure) {
        var dataEmail = { Name: 'email', Value: email };
        var dataEmployeeId = { Name: 'custom:employeeId', Value: employeeId }; // 사용자 정의 속성 추가

        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
        var attributeEmployeeId = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmployeeId);
        
        var dataRole = null;
        if(employeeId.length === 9) dataRole = {Name: 'custom:role', Value: "student"};
        else if(employeeId.length === 5) dataRole = {Name: 'custom:role', Value: "admin"};
        
        var attributeRole = new AmazonCognitoIdentity.CognitoUserAttribute(dataRole);

        userPool.signUp(toUsername(email), password, [attributeEmail, attributeRole, attributeEmployeeId], null,
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
        var employeeId = $('#employeeIDInputRegister').val();
        var errorMessageDiv = $('#errorMessageRegister'); // 오류 메시지 표시 div 추가
    
        var onSuccess = function registerSuccess(result) {
            var cognitoUser = result.user;
            console.log('User name is ' + cognitoUser.getUsername());
            alert('회원가입에 성공했습니다. 이메일에서 확인 코드를 확인하세요.');
            window.location.href = 'verify.html';
        };
    
        var onFailure = function registerFailure(err) {
            let errorMessage;
            switch (err.code) {
                case 'UsernameExistsException':
                    errorMessage = '이미 존재하는 이메일 주소입니다.';
                    break;
                case 'InvalidPasswordException':
                    errorMessage = '비밀번호는 최소 8자 이상이어야 하며 숫자와 특수문자를 포함해야 합니다.';
                    break;
                case 'CodeMismatchException':
                    errorMessage = '잘못된 확인 코드입니다. 다시 시도하세요.';
                    break;
                default:
                    errorMessage = err.message || '알 수 없는 오류가 발생했습니다. 다시 시도하세요.';
            }
            errorMessageDiv.text(errorMessage).css('display', 'block');
        };
        
    
        event.preventDefault();
    
        if (password === password2) {
            register(email, password, employeeId, onSuccess, onFailure);
        } else {
            errorMessageDiv.text('비밀번호가 일치하지 않습니다.').css('display', 'block');
        }
    }
    

    function handleVerify(event) {
        var email = $('#emailInputVerify').val();
        var code = $('#codeInputVerify').val();
        var errorMessageDiv = $('#errorMessageVerify'); // 오류 메시지 표시 div 추가
        event.preventDefault();
    
        var onSuccess = function verifySuccess(result) {
            alert('인증에 성공했습니다. 로그인 페이지로 이동합니다.');
            window.location.href = signinUrl;
        };
    
        var onFailure = function registerFailure(err) {
            let errorMessage;
            switch (err.code) {
                case 'UsernameExistsException':
                    errorMessage = '이미 존재하는 이메일 주소입니다.';
                    break;
                case 'InvalidPasswordException':
                    errorMessage = '비밀번호는 최소 8자 이상이어야 하며 숫자와 특수문자를 포함해야 합니다.';
                    break;
                case 'CodeMismatchException':
                    errorMessage = '잘못된 확인 코드입니다. 다시 시도하세요.';
                    break;
                default:
                    errorMessage = err.message || '알 수 없는 오류가 발생했습니다. 다시 시도하세요.';
            }
            errorMessageDiv.text(errorMessage).css('display', 'block');
        };
        
    
        verify(email, code, onSuccess, onFailure);
    }
    

    // 창 닫을 때 로그아웃 처리
    window.onbeforeunload = function () {
        sessionStorage.removeItem('authToken');
    };
}(jQuery));