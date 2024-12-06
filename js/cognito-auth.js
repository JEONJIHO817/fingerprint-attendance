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
            register(email, password, employeeId, onSuccess, onFailure); // Role 전달
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
