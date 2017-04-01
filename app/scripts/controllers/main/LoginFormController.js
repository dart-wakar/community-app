(function (module) {
    mifosX.controllers = _.extend(module, {
        LoginFormController: function (scope, authenticationService, resourceFactory, httpService, $timeout) {
            scope.loginCredentials = {};
            scope.passwordDetails = {};
            scope.authenticationFailed = false;
            scope.load = false;
            scope.autoSignInFailed = false;
            scope.cred = {};

            scope.tryAutoSignIn = function () {
                scope.autoSignIn(false);
            }

            scope.autoSignIn = function (unmediated) {
                if (navigator.credentials){
                    return navigator.credentials.get({
                        password: true,
                        unmediated: unmediated
                    }).then(function(cred){
                        if (cred) {
                            console.log("Auto SignIn Possible");
                            console.log(cred);
                            scope.loginCredentials.username = cred.id;
                            scope.loginCredentials.password = cred.passwordName;
                            scope.login();
                            //assign from cred to scope.loginCredentials accordingly,the call login
                        } else{
                            console.log("Credential object is not available");
                            scope.autoSignInFailed = true;
                        }
                    });
                } else {
                    console.log("Credential Management Api not available");
                    scope.autoSignInFailed = true;
                }
            }


            scope.login = function () {
                scope.load = true;
                console.log(scope.loginCredentials);
                if (scope.autoSignInFailed === true) {
                    scope.cred = new PasswordCredential({username: scope.loginCredentials.username,password:scope.loginCredentials.password,id: "mifos"});
                    console.log(scope.cred);
                }
                authenticationService.authenticateWithUsernamePassword(scope.loginCredentials);
                
                //delete scope.loginCredentials.password;
            };

            scope.$on("UserAuthenticationFailureEvent", function (event, data, status) {
                //delete scope.loginCredentials.password;
                scope.authenticationFailed = true;
                if(status != 401) {
                    scope.authenticationErrorMessage = 'error.connection.failed';
                    scope.load = false;
                } else {
                   scope.authenticationErrorMessage = 'error.login.failed';
                   scope.load = false;
                }
            });

            scope.$on("UserAuthenticationSuccessEvent", function (event, data) {
                scope.load = false;
                console.log(data);
                console.log(scope.autoSignInFailed);
                if (scope.autoSignInFailed == true) {
                    navigator.credentials.store(scope.cred);
                    scope.autoSignInFailed = false;
                    //let cred = new PasswordCredential(scope.form);
                    //navigator.credentials.store(cred);
                }
                timer = $timeout(function(){
                    delete scope.loginCredentials.password;
                },2000);
             });

            /*This logic is no longer required as enter button is binded with text field for submit.
            $('#pwd').keypress(function (e) {
                if (e.which == 13) {
                    scope.login();
                }
            });*/

            /*$('#repeatPassword').keypress(function (e) {
                if (e.which == 13) {
                    scope.updatePassword();
                }
            });*/

            scope.updatePassword = function (){
                resourceFactory.userListResource.update({'userId': scope.loggedInUserId}, scope.passwordDetails, function (data) {
                    //clear the old authorization token
                    httpService.cancelAuthorization();
                    scope.authenticationFailed = false;
                    scope.loginCredentials.password = scope.passwordDetails.password;
                    authenticationService.authenticateWithUsernamePassword(scope.loginCredentials);
                });
            };
        }
    });
    mifosX.ng.application.controller('LoginFormController', ['$scope', 'AuthenticationService', 'ResourceFactory', 'HttpService','$timeout', mifosX.controllers.LoginFormController]).run(function ($log) {
        $log.info("LoginFormController initialized");
    });
}(mifosX.controllers || {}));
