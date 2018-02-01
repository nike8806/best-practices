export type reportLevelType = 'debug' | 'info' | 'warning' | 'error' | 'critical' | 'off';
export enum ErrorLevelEnum {
    debug,
    info,
    warning,
    error,
    critical
};

// Interface that describe values to initialize the module
export interface LoggerConfig {
    rollbar?: {
        accessToken: string;
        environment: string;
        reportLevel: reportLevelType;
    };

    console: {
        reportLevel: reportLevelType;
    };

    fabric?: {
        reportLevel: reportLevelType;
    };
}

export interface FunctionReferenceType {
    debug: string;
    info: string;
    warning: string;
    error: string;
    critical: string;
}

