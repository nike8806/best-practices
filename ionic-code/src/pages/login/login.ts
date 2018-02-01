import { Component, Inject } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController, ToastController, IonicPage } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { UserProvider, UserProfile } from '../../providers/user';
import { GeLoggerProvider } from '../../providers/ge-logger';
import { GeToastErrorProvider, OFFLINE_ERROR_CODE } from '../../providers/ge-toast-error';
import * as stackTrace from 'stacktrace-js';
import { Config } from '../../config/config';
import * as _ from 'lodash';

@IonicPage({
    name: 'login',
    priority: 'off'
})
@Component({
    selector: 'page-login',
    templateUrl: 'login.html'
})

export class LoginPage {

    public isMakingLoginRequest;
    public appName: string = Config.get('appName');

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public translate: TranslateService,
        public userService: UserProvider,
        public toastCtrl: ToastController,
        private _inAppBrowser: InAppBrowser,
        private _geLoggerProvider: GeLoggerProvider,
        private _geToastErrorProvider: GeToastErrorProvider,
        @Inject('forgottenPasswordURL') private _forgottenPasswordURL: string
    ) { }

    ionViewWillEnter() {
        this.translate.use(this.translate.defaultLang);
        this.isMakingLoginRequest = false;
        this._geLoggerProvider.addLog('LoginPage', 'WILL_ENTER_PAGE');
    }

    /**
     * Function to execute after entered to the view
     */
    ionViewDidEnter() {
        // If is redirected to login we show a message
        if (this.navParams.get('refreshTokenError')) {
            this._geToastErrorProvider.getErrorToast(this.navParams.get('refreshTokenError'));
        }
    }

    /*
     * @TODO Button to make login
     */
    login(username: string, password: string) {
        this.isMakingLoginRequest = true;

        let loading = this.loadingCtrl.create();
        loading.present();

        this.userService
            .login(username, password)
            .flatMap((res: any) => {
                return this.userService.getUserProfile();
            })
            .finally(() => loading.dismiss())
            .subscribe((userProfile: UserProfile) => {
                let displayLang = this.userService.getUserTranslateLang(userProfile);
                this.translate.use(displayLang.toLowerCase())
                    .subscribe( () => {
                        this.navCtrl.setRoot('welcome');
                    });
            },  (err) => { this._loginHandleError(err); });
    }
    /**
     * Redirect to reset password
     */
    troubleWithLogin() {
        this._inAppBrowser.create(this._forgottenPasswordURL, '_system');
    }

    /*
     * Handling error of login
     */
    private _loginHandleError(error: any) {
        let body;

        body = error.text() !== '' ? error.json() : {};
        error.errorType = _.get(body, 'error', null);

        // Setting flag to indicate that the request was finish
        this.isMakingLoginRequest = false;

        this._geToastErrorProvider.getErrorToast(error);

        // If we have an offline Error we wont log
        if (OFFLINE_ERROR_CODE === _.get(error, 'status')) {
            return;
        }
        // Send error when we have an server error
        let stack;
        stackTrace
            .get({ offline: true }).then(_stack => stack = _stack)
            .catch(_err => this._geLoggerProvider.addLog(_err, 'ERROR GETTING STACK'))
            .then(() => this._geLoggerProvider.error(`UserProvider.login() `, error, stack));
    }
}
