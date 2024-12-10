/*global WildRydes _config AmazonCognitoIdentity*/

var WildRydes = window.WildRydes || {};

(function modifyProfileScopeWrapper($) {
    var authToken;

    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            alert("User not authenticated. Redirecting to login page.");
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Error retrieving auth token:', error);
        alert("User not authenticated. Redirecting to login page.");
        window.location.href = '/signin.html';
    });

    $('#changePasswordForm').on('submit', function (event) {
        event.preventDefault();
    
        var currentPassword = $('#currentPassword').val();
        var newPassword = $('#newPassword').val();
    
        var cognitoUser = getCurrentCognitoUser();
        if (!cognitoUser) {
            alert("사용자가 인증되지 않았습니다. 다시 로그인하세요.");
            window.location.href = '/signin.html';
            return;
        }
    
        cognitoUser.getSession(function (err, session) {
            if (err || !session.isValid()) {
                alert("세션이 만료되었습니다. 다시 로그인하세요.");
                window.location.href = '/signin.html';
                return;
            }
    
            cognitoUser.changePassword(currentPassword, newPassword, function (err, result) {
                if (err) {
                    console.error('비밀번호 변경 실패:', err.message);
                    alert("비밀번호 변경 실패: " + err.message);
                } else {
                    alert("비밀번호가 성공적으로 변경되었습니다.");
                    $('#changePasswordForm').trigger("reset");
                }
            });
        });
    });
    

    // Delete Account Form Submission
    $('#deleteAccountForm').on('submit', function (event) {
        event.preventDefault();

        var confirmDelete = confirm("정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
        if (!confirmDelete) return;

        var cognitoUser = getCurrentCognitoUser();
        if (!cognitoUser) {
            alert("사용자가 인증되지 않았습니다. 다시 로그인하세요.");
            window.location.href = '/signin.html';
            return;
        }

        cognitoUser.getSession(function (err, session) {
            if (err || !session.isValid()) {
                alert("세션이 만료되었습니다. 다시 로그인하세요.");
                window.location.href = '/signin.html';
                return;
            }

            cognitoUser.deleteUser(function (err, result) {
                if (err) {
                    console.error('계정 삭제 실패:', err.message);
                    alert("계정 삭제 실패: " + err.message);
                } else {
                    alert("계정이 성공적으로 삭제되었습니다.");
                    sessionStorage.removeItem('authToken'); // 세션 정보 제거
                    window.location.href = '/signin.html'; // 로그인 페이지로 리다이렉트
                }
            });
        });
    });


    // Helper Function to Get Current Cognito User
    function getCurrentCognitoUser() {
        var poolData = {
            UserPoolId: _config.cognito.userPoolId,
            ClientId: _config.cognito.userPoolClientId
        };

        var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        return userPool.getCurrentUser();
    }
}(jQuery));
