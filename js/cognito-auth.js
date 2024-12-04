import { cognitoConfig } from './config.js';

const { userPoolId, clientId, region } = cognitoConfig;
const AmazonCognitoIdentity = AWSCognito.CognitoIdentityServiceProvider;
const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId,
});

// 회원가입
export const register = (email, password) => {
    const attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email,
        }),
    ];

    userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) {
            alert('회원가입 실패: ' + err.message);
            return;
        }
        alert('회원가입 성공! 이메일 인증을 완료하세요.');
    });
};

// 로그인
export const login = (email, password) => {
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: email,
        Password: password,
    });

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: email,
        Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            alert('로그인 성공!');
            const idToken = result.getIdToken().getJwtToken();
            console.log('ID Token:', idToken);
        },
        onFailure: (err) => {
            alert('로그인 실패: ' + err.message);
        },
    });
};

// 이메일 인증
export const verifyEmail = (email, code) => {
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: email,
        Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
            alert('인증 실패: ' + err.message);
            return;
        }
        alert('이메일 인증 성공!');
    });
};
