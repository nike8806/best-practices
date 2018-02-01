import { Inject, Injectable } from '@angular/core';
import { reportLevelType, FunctionReferenceType } from '../ge-logger.model';
import { RollbarService } from 'angular-rollbar';
import { BaseGeLogger } from '../base-ge-logger';
import { StackFrame } from 'stacktrace-js';

@Injectable()
export class GeRollbarProvider extends BaseGeLogger {
    protected readonly _functionReferenceName: FunctionReferenceType = {
        debug: 'log',
        info: 'info',
        warning: 'warn',
        error: 'error',
        critical: 'critical'
    };

    constructor(
        public _rollBarService: RollbarService,
        @Inject('rollbarReportLevel') protected _reportLevel: reportLevelType
    ) {
        super();
        if (this._reportLevel === 'off') {
            this._rollBarService.configure({enabled: false});
        }
    }

    /**
      * Rollbar log
      * calling the rollbar Service in base of the rollbarNameFn
      */
    protected _logEvent(errorLevel: reportLevelType, message: string, errorData?: any, stacktrace?: StackFrame[], callback?: Function) {
        this._rollBarService[this._functionReferenceName[errorLevel]](message, errorData, callback);
    }
}
