/*global WildRydes _config AmazonCognitoIdentity AWSCognito*/

document.addEventListener('DOMContentLoaded', () => {
    const profileNameElement = document.querySelector('.profile-info h1');
    const profileEmailElement = document.querySelector('.profile-info p');

    // 현재 로그인한 사용자 정보 가져오기
    const userPool = new AmazonCognitoIdentity.CognitoUserPool({
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId,
    });

    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
        cognitoUser.getSession((err, session) => {
            if (err || !session.isValid()) {
                console.error('세션이 유효하지 않습니다.');
                return;
            }   

            // 사용자 속성 가져오기
            cognitoUser.getUserAttributes((err, attributes) => {
                if (err) {
                    console.error('사용자 속성 가져오기 실패:', err);
                    return;
                }

                // 속성에서 이름과 이메일 추출
                const nameAttribute = attributes.find(attr => attr.getName() === 'custom:username');
                const emailAttribute = attributes.find(attr => attr.getName() === 'email');

                const userName = nameAttribute ? nameAttribute.getValue() : '사용자님';
                const userEmail = emailAttribute ? emailAttribute.getValue() : '';

                // HTML 요소 업데이트
                profileNameElement.textContent = `${userName}님, 안녕하세요.`;
                profileEmailElement.textContent = userEmail;
            });
        });
    } else {
        console.log('로그인된 사용자가 없습니다.');
    }
});


var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function rideScopeWrapper($) {
    var authToken;

    // 인증 토큰 설정
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    $(function onDocReady() {
        // 출근부 조회 버튼 클릭 시
        $('#checkAttendance').click(function () {
          console.log('출근부 조회 버튼 클릭됨');
          window.location.href = '/attendance.html';
        });
      
        $('#clockInOut').click(function () {
            console.log('출/퇴근 버튼 클릭됨');
            window.location.href = '/clockInOut.html';
        });

        $('#modify-profile').click(function () {
            console.log('회원정보 수정 버튼 클릭됨');
            window.location.href = '/modify-profile.html';
        });
        // 로그아웃 버튼 클릭 시
        $('#signOut').click(function () {
            WildRydes.signOut();
            alert('로그아웃되었습니다.');
            window.location.href = '/index.html';
        });
    });
}(jQuery));
