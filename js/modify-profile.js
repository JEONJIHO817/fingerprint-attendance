/*global WildRydes _config AmazonCognitoIdentity */

var WildRydes = window.WildRydes || {};

(function accountManagementScopeWrapper($) {
  var poolData = {
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.userPoolClientId
  };

  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  var cognitoUser = userPool.getCurrentUser();

  if (!cognitoUser) {
    alert('로그인이 필요합니다.');
    window.location.href = '/signin.html';
  }

  // 비밀번호 변경
  $('#passwordChangeForm').submit(function (event) {
    event.preventDefault();
    const oldPassword = $('#oldPassword').val();
    const newPassword = $('#newPassword').val();

    cognitoUser.changePassword(oldPassword, newPassword, function (err, result) {
      if (err) {
        alert('비밀번호 변경 중 오류가 발생했습니다: ' + err.message);
        console.error(err);
      } else {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        $('#passwordChangeForm')[0].reset();
      }
    });
  });

  // 계정 삭제
  $('#accountDeleteForm').submit(function (event) {
    event.preventDefault();
    const confirmPassword = $('#confirmPassword').val();

    // 재인증을 수행해야 계정을 삭제할 수 있음
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username: cognitoUser.username,
      Password: confirmPassword
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function () {
        cognitoUser.deleteUser(function (err, result) {
          if (err) {
            alert('계정 삭제 중 오류가 발생했습니다: ' + err.message);
            console.error(err);
          } else {
            alert('계정이 성공적으로 삭제되었습니다.');
            window.location.href = '/signin.html';
          }
        });
      },
      onFailure: function (err) {
        alert('재인증 실패: ' + err.message);
        console.error(err);
      }
    });
  });
}(jQuery));
