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

    WildRydes.signOut = function signOut() {
        userPool.getCurrentUser().signOut();
    };

    WildRydes.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });


    /*
     * Cognito User Pool functions
     */

    function register(email, password, role, onSuccess, onFailure) {
    var dataEmail = { Name: 'email', Value: email };
    var dataRole = { Name: 'custom:role', Value: role }; // 사용자 정의 속성 추가

    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    var attributeRole = new AmazonCognitoIdentity.CognitoUserAttribute(dataRole);

    userPool.signUp(toUsername(email), password, [attributeEmail, attributeRole], null,
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
            onSuccess: onSuccess,
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
        var errorMessageDiv = $('#errorMessage'); // 오류 메시지를 보여줄 div (HTML에 추가해야 함)
        event.preventDefault();
    
        // 로그인 시도
        signin(email, password,
            function signinSuccess(cognitoUser) {
                console.log('Successfully Logged In');
    
                // 세션 가져오기
                cognitoUser.getSession(function (err, session) {
                    if (err) {
                        console.error('Error getting session:', err);
                        errorMessageDiv.text('Failed to retrieve session: ' + err.message).show();
                        return;
                    }
    
                    // 사용자 역할 확인
                    var role = session.getIdToken().payload['custom:role']; // 역할 가져오기
                    console.log('User role:', role);
    
                    if (role === 'student') {
                        window.location.href = 'student.html'; // 학생 페이지로 리디렉션
                    } else if (role === 'admin') {
                        window.location.href = 'admin.html'; // 관리자 페이지로 리디렉션
                    }
                });
            },
            function signinError(err) {
                console.error('Sign-in failed:', err);
    
                // 오류 메시지 표시
                errorMessageDiv.text('Sign-in failed: ' + err.message).show();
            }
        );
    }
    

    function handleRegister(event) {
        var email = $('#emailInputRegister').val();
        var password = $('#passwordInputRegister').val();
        var password2 = $('#password2InputRegister').val();
        var role = $('#roleInputRegister').val(); // Role 값 가져오기
    
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
            register(email, password, role, onSuccess, onFailure); // Role 전달
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
                console.log('call result: ' + result);
                console.log('Successfully verified');
                alert('Verification successful. You will now be redirected to the login page.');
                window.location.href = signinUrl;
            },
            function verifyError(err) {
                alert(err);
            }
        );
    }
}(jQuery));
