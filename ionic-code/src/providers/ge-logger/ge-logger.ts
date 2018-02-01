import { Injectable, Inject, Optional } from '@angular/core';
import { reportLevelType, ErrorLevelEnum, FunctionReferenceType } from './ge-logger.model';
import { App } from 'ionic-angular';
import { GeRollbarProvider } from './ge-rollbar';
import { GeFabricProvider } from './ge-fabric';
import { StackFrame } from 'stacktrace-js';

@Injectable()
export class GeLoggerProvider {

    constructor(
        private _app: App,
        @Optional()  private _geRollbarProvider: GeRollbarProvider,
        @Optional()  private _geFabricProvider: GeFabricProvider,
        @Inject('consoleReportLevel') private _consoleReportLevel: reportLevelType
    ) {}

    /**
     * Log in console and send the error to the avalaible tools
     */
    private _log(
        errorLevel: reportLevelType,
        message: string,
        errorData?: Object,
        stacktrace?: StackFrame[],
        callback?: Function) {

        let pageName = this._getPageName();
        if (pageName) {
            message = `${pageName} -> ${message}`;
        }

        this._consoleLog(errorLevel, message, this._consoleReportLevel, errorData);
        this.sendError(errorLevel, message, errorData, stacktrace);
    }

    private _getPageName(): string {
        let pageName: string;

        try {
            let view = this._app.getActiveNav().getActive();
            pageName = view.name;
        } catch (e) {
            pageName = null;
        }

        return pageName;
    }

    /**
     * Send error to the avalaible tools
     */
    public sendError(
        errorLevel: reportLevelType,
        message: string,
        errorData?: Object,
        stacktrace?: StackFrame[]
    ) {
        if (this._geRollbarProvider) {
            this._geRollbarProvider.log(errorLevel, message, errorData);
        }

        if (this._geFabricProvider) {
            this._geFabricProvider.log(errorLevel, message, errorData, stacktrace);
        }
    }
    /**
     * Add log message
     * Fabric
     */
    public addLog(message: string, key?: string) {
        this._consoleLog('debug', `${key} -> ${message}`, 'debug');
        if (this._geFabricProvider) {
            this._geFabricProvider.addLog(message, key);
        }
    }

    public setUserIdentifier(userId: string) {
        if (this._geFabricProvider) {
            this._geFabricProvider.setUserIdentifier(userId || 'Unknown');
        }
    }

    public setUserName(userName: string) {
        if (this._geFabricProvider) {
            this._geFabricProvider.setUserName(userName || 'Unknown');
        }
    }

    public setUserEmail(userEmail: string) {
        if (this._geFabricProvider) {
            this._geFabricProvider.setUserEmail(userEmail || 'Unknown');
        }
    }

    public setStringValueForKey(value: string, key: string) {
        if (this._geFabricProvider) {
            this._geFabricProvider.setStringValueForKey(value, key);
        }
    }
    /**
     * Console Log
     */
    private _consoleLog(errorLevel: reportLevelType, message: string, reportLevel: reportLevelType, errorData?: any) {
        // if the report level is off we skip all the logs
        if (this._consoleReportLevel === 'off') {
            return;
        }

        let consoleFunctionName: FunctionReferenceType = {
            debug: 'log',
            info: 'info',
            warning: 'warn',
            error: 'error',
            critical: 'error'
        };

        // Check the errorLevel to show the console and send to rollbackService
        if (ErrorLevelEnum[errorLevel] >= ErrorLevelEnum[reportLevel]) {
            console[consoleFunctionName[errorLevel]](...[`${message}`, errorData].filter(n => n));
        }
    }

    debug(message: string, errorData?: Object, stacktrace?: StackFrame[], callback?: Function) {
        this._log('debug', message, errorData, stacktrace, callback);
    }

    info(message: string, errorData?: Object, stacktrace?: StackFrame[], callback?: Function) {
        this._log('info', message, errorData, stacktrace, callback);
    }

    warn(message: string, errorData?: Object, stacktrace?: StackFrame[], callback?: Function) {
        this._log('warning', message, errorData, stacktrace, callback);
    }

    error(message: string, errorData?: Object, stacktrace?: StackFrame[], callback?: Function) {
        this._log('error', message, errorData, stacktrace, callback);
    }

    critical(message: string, errorData?: Object, stacktrace?: StackFrame[], callback?: Function) {
        this._log('critical', message, errorData, stacktrace, callback);
    }
}
