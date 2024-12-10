/*global WildRydes _config AmazonCognitoIdentity*/

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

    // Change Password Form Submission
    $('#changePasswordForm').on('submit', function (event) {
        event.preventDefault();

        var currentPassword = $('#currentPassword').val();
        var newPassword = $('#newPassword').val();

        if (!currentPassword || !newPassword) {
            alert('Please fill in all fields.');
            return;
        }

        var cognitoUser = getCurrentCognitoUser();
        if (!cognitoUser) {
            alert("User not authenticated.");
            return;
        }

        cognitoUser.changePassword(currentPassword, newPassword, function (err, result) {
            if (err) {
                console.error('Error changing password:', err.message);
                alert("Failed to change password: " + err.message);
            } else {
                alert("Password changed successfully.");
                $('#changePasswordForm').trigger("reset");
            }
        });
    });

    // Delete Account Form Submission
    $('#deleteAccountForm').on('submit', function (event) {
        event.preventDefault();

        var confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone.");
        if (!confirmDelete) return;

        var cognitoUser = getCurrentCognitoUser();
        if (!cognitoUser) {
            alert("User not authenticated.");
            return;
        }

        cognitoUser.deleteUser(function (err, result) {
            if (err) {
                console.error('Error deleting account:', err.message);
                alert("Failed to delete account: " + err.message);
            } else {
                alert("Account deleted successfully.");
                sessionStorage.removeItem('authToken');
                window.location.href = '/signin.html';
            }
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
