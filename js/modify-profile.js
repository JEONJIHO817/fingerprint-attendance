/*global WildRydes _config AmazonCognitoIdentity*/

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
    const password = document.getElementById('new-password').value;
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
