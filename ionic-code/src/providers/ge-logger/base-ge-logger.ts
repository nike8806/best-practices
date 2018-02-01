import {reportLevelType, FunctionReferenceType } from './ge-logger.model';
import { StackFrame } from 'stacktrace-js';

export abstract class BaseGeLogger {
    protected abstract readonly _functionReferenceName: FunctionReferenceType;
    protected abstract _reportLevel: reportLevelType;

    log(errorLevel: reportLevelType, message: string, errorData?: any, stacktrace?: StackFrame[], callback?: Function) {
        // if the report level is off we skip all the logs
        if (this._reportLevel === 'off') {
            return;
        }
        this._logEvent(errorLevel, message, errorData, stacktrace, callback);
    };
    protected abstract _logEvent(errorLevel: reportLevelType, message: string, errorData?: any, stacktrace?: StackFrame[], callback?: Function);
}
