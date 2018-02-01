import { NgModule, ModuleWithProviders } from '@angular/core';
import { RollbarService, RollbarModule, RollbarConfig } from 'angular-rollbar';
import { LoggerConfig, GeLoggerProvider } from './index';
import { GeRollbarProvider } from './ge-rollbar';
import { GeFabricProvider } from './ge-fabric';

@NgModule({imports: [RollbarModule]})
export class GeLoggerModule {

    /*
     * Rollbar Setup
     */
    private static _rollbarSetup(rollbarParams: any): any[] {
        let rollbarConfig = {
            accessToken: rollbarParams.accessToken,
            captureUncaught: true,
            captureUnhandledRejections: true,
            payload: {
                environment: rollbarParams.environment
            },
            reportLevel: rollbarParams.reportLevel
        };

        return [
            {provide: RollbarConfig, useValue: rollbarConfig},
            RollbarService,
            { provide: 'rollbarReportLevel', useValue: rollbarParams.reportLevel },
            GeRollbarProvider
        ];
    }

    /*
     * Fabric setup
     */
    private static _fabricSetup(fabricParams: any): any[] {
        return [
            { provide: 'fabricReportLevel', useValue: fabricParams.reportLevel },
            GeFabricProvider
        ];
    }

    /*
     * Returning the module setup
     */
    static forRoot(config: LoggerConfig): ModuleWithProviders {
        let moduleProviders = [];

        // if we have rollbar data configuration we use this logger
        if (config.rollbar) {
            moduleProviders.push(this._rollbarSetup(config.rollbar));
        }

        // if we have fabric data configuration we use this logger
        if (config.fabric) {
            moduleProviders.push(this._fabricSetup(config.fabric));
        }

        // settting the console error
        moduleProviders.push([
            { provide: 'consoleReportLevel', useValue: config.console.reportLevel },
            GeLoggerProvider,
        ]);

        return {
            ngModule: GeLoggerModule,
            providers: moduleProviders
        };
    }
}
