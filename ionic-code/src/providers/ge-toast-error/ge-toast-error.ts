import { Injectable } from '@angular/core';
import {ToastController, ToastOptions, Toast } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { GeNetworkProvider } from '../ge-network';
import { TIMEOUT_ERROR_CODE, OFFLINE_ERROR_CODE} from './ge-error-codes/ge-error-codes.model';
import 'rxjs/add/operator/takeWhile';

@Injectable()
export class GeToastErrorProvider {
    private _toastError: Toast;

    constructor(
        private _toastCtrl: ToastController,
        private _translate: TranslateService,
        private _geNetworkProvider: GeNetworkProvider
    ) {}

    /**
     * Get the toast error
     */
    getErrorToast(error: any, retryCallback?: Function) {
        // Getting body error from error (Authentication requests)
        this._translate.get([
            'ERROR_MESSAGES.CONNECTION_ERROR',
            'ERROR_MESSAGES.RETRY',
            'ERROR_MESSAGES.UNEXPECTED_ERROR',
            'LOGIN.INCORRECT_CREDENTIALS',
            'LOGIN.TYPE_CREDENTIALS_AGAIN',
            'ERROR_MESSAGES.CONECTION_LOST',
            'ERROR_MESSAGES.INVALID_ID',
            'ERROR_MESSAGES.NOT_FOUND'
        ]).subscribe((translated) => {
            // execute actions if 
            if (error.status === OFFLINE_ERROR_CODE) {
                this._offlineStatus(retryCallback);
            }

            // show error Toast
            this._showErrorToast(
                translated[this._getErrorFromStatus(error.status, error.errorType)],
                translated['ERROR_MESSAGES.RETRY'],
                (error.status === OFFLINE_ERROR_CODE) ? 0 : 4000,
                (error.status === OFFLINE_ERROR_CODE) ? null : retryCallback);
        });
    }

    /**
     * Actions to do with differents status
     */
    private _offlineStatus(retryCallback) {
        // Enabling a watcher what recall the callback function
        // when the network will be online
        this._geNetworkProvider.onConnect
            .subscribe(
            () => {
                this.dismissAllToast();
                if (retryCallback) {
                    retryCallback();
                }
            });
    }

    /**
     * Getting the Error message for login
     */
    private _getErrorFromStatus(status: number, errorType?: string) {
        if (status === TIMEOUT_ERROR_CODE || status === 504) {
            return 'ERROR_MESSAGES.CONNECTION_ERROR';
        }

        if (status === OFFLINE_ERROR_CODE) {
            return 'ERROR_MESSAGES.CONECTION_LOST';
        }

        if (status === 400 && errorType === 'invalid_grant') {
            return 'LOGIN.INCORRECT_CREDENTIALS';
        }

        if (status === 400) {
            return 'ERROR_MESSAGES.INVALID_ID';
        }

        if (status === 401) {
            return 'LOGIN.TYPE_CREDENTIALS_AGAIN';
        }

        if (status === 404) {
            return 'ERROR_MESSAGES.NOT_FOUND';
        }

        return 'ERROR_MESSAGES.UNEXPECTED_ERROR';
    }

    /**
    * Get the toast error
    */
    getUnexpectedErrorToast(retryCallback?: Function) {
        this._translate.get([
            'ERROR_MESSAGES.UNEXPECTED_ERROR',
            'ERROR_MESSAGES.RETRY'
        ]).subscribe((translated) => {
            // Show error Toast
            this._showErrorToast(
                translated['ERROR_MESSAGES.UNEXPECTED_ERROR'],
                translated['ERROR_MESSAGES.RETRY'],
                4000,
                retryCallback);
        });
    }

    /**
     * @TODO show errorToast
     */
    private _showErrorToast(message: string, retryMessage: string, duration: number, retryCallback?: Function) {
         if (this._toastError) {
            this._toastError.dismissAll();
        }

        let toastConfig: ToastOptions = {
            message: message,
            showCloseButton: true,
            closeButtonText: retryMessage,
            cssClass: 'toast-ge-retry',
            position: 'top'
        };

        if (duration > 0 && !retryCallback) {
            toastConfig.duration = duration;
        }

        if (!retryCallback) {
            toastConfig.cssClass = 'toast-ge';
            toastConfig.closeButtonText = ' ';
        }

        this._toastError = this._toastCtrl.create(toastConfig);
        this._toastError.onDidDismiss((data, role) => {
            if (role === 'close' && retryCallback) {
                retryCallback();
            }
        });

        this._toastError.present();
    }

    /**
     * Close all toasts error
     */
    public dismissAllToast() {
        if (this._toastError) {
            this._toastError.dismissAll();
        }
        // Removing the subscription from the connect
        this._geNetworkProvider.disposeOnConnectSubscription();
    }
}
