import { Inject, Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { reportLevelType, FunctionReferenceType, ErrorLevelEnum } from '../ge-logger.model';
import { BaseGeLogger } from '../base-ge-logger';
import { StackFrame } from 'stacktrace-js';
import * as _ from 'lodash';

@Injectable()
export class GeFabricProvider extends BaseGeLogger {
    protected readonly _functionReferenceName: FunctionReferenceType = {
        debug: 'log',
        info: 'info',
        warning: 'warning',
        error: 'sendNonFatalCrash',
        critical: 'sendNonFatalCrash'
    };

    public addLog(log: string, key = 'LOG') {
        if (!this._isFabricAvailable()) {
            return;
        }
        fabric.Crashlytics.addLog(`${key} =====> ${log}`);
    }

    public setUserIdentifier(userIdentifier: string) {
        if (!this._isFabricAvailable()) {
            return;
        }
        fabric.Crashlytics.setUserIdentifier(userIdentifier);
    }

    public setUserName(userName: string) {
        if (!this._isFabricAvailable()) {
            return;
        }
        fabric.Crashlytics.setUserName(userName);
    }

    public setUserEmail(userEmail: string) {
        if (!this._isFabricAvailable()) {
            return;
        }
        fabric.Crashlytics.setUserEmail(userEmail);
    }

    public setStringValueForKey(value: string, key: string) {
        if (!this._isFabricAvailable()) {
            return;
        }
        fabric.Crashlytics.setStringValueForKey(value, key);
    }

    constructor(
        private _platform: Platform,
        @Inject('fabricReportLevel') protected _reportLevel: reportLevelType
    ) {
        super();
    }

    private _isFabricAvailable(): boolean {
        let isAvailable: boolean = !!window['fabric'];
        if (!isAvailable) {
            console.warn('Fabric is not available');
        }
        return isAvailable;
    }

    protected _logEvent(errorLevel: reportLevelType, message: any, errorData?: Error, stacktrace?: StackFrame[], callback?: Function) {

        if (!this._platform.is('cordova')) {
            console.warn('Cordova is not avalaible for fabric');
            return;
        }

        if (!this._isFabricAvailable()) {
            return;
        }

        if (ErrorLevelEnum[errorLevel] >= ErrorLevelEnum[this._reportLevel]) {
            // if (typeof message === 'object') {
            //     errorData = message;
            //     message = message.message;
            // }

            this._sendError(message, errorData, stacktrace);
        }
    }

    private _createErrorFromMessage(message?: string) {
        if (!message) {
            message = 'No error message';
        }
        return new Error(message);
    }

    private _getLogError(error: Error): string {
        let logError = error.toString();
        let stringifyError = '';

        try {
            stringifyError = JSON.stringify(error);
        } catch (e) {}

        return `${logError} -> ${stringifyError}`;
    }

    private _sendError(message, error?: any, stacktrace?: StackFrame[]) {

        if (!(error instanceof Error)) {
            error = this._createErrorFromMessage(message);
        }

        let errorMessage: string = this._getErrorMessage(message, error);

        let _sendIOS = () => {
            if (stacktrace) {
                try {
                    this.addLog(JSON.stringify(stacktrace), 'STACKTRACE');
                } catch (e) {}
            }
            fabric.Crashlytics.recordError(errorMessage, this._getIOSErrorCode(error));
        };

        let _sendAndroid = () => {
            fabric.Crashlytics.sendNonFatalCrash(errorMessage, stacktrace);
        };

        (() => {

            this.addLog(this._getLogError(error), 'ERROR');

            if (this._platform.is('ios')) {
                return _sendIOS();
            }

            if (this._platform.is('android')) {
                return _sendAndroid();
            }
        })();
    }

    private _getErrorMessage(message: string, error: Error): string {

        let _errorMsg = (err: Error): string => {
            if (_.has(err, 'message')) {
                return err.message;
            }

            if (err) {
                return err.toString();
            }

            return '';
        };

        return `${message} -> ${_errorMsg(error)}`;
    }

    /**
     * Retrieves an error code based on an Error object
     */
    private _getIOSErrorCode(error: Error): number {
        let errorCode: number = -1;

        if (error) {
            let hash: number = this._hash(error.toString());
            let hashLowerThanObjectiveCINT: number = Math.round(hash / 1000);
            errorCode = hashLowerThanObjectiveCINT * errorCode;
        }

        return errorCode;
    }

    /**
        A string hashing function based on Daniel J. Bernstein's popular 'times 33' hash algorithm.
        @param {string} text - String to hash
        @return {number} Resulting number.
    */
    private _hash(text: string): number {

        let hash = 5381;
        let index = text.length;

        while (index) {
            hash = (hash * 33) ^ text.charCodeAt(--index);
        }

        return hash >>> 0;
    }
}
