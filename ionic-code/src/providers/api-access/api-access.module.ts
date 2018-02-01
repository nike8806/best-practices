import { ErrorHandler, NgModule, ModuleWithProviders } from '@angular/core';
import { Device } from '@ionic-native/device';
import { IonicErrorHandler } from 'ionic-angular';

import { ApiClientProvider, ApiAccessProvider, ApiAuthProvider } from './index';
import { NativeStorage } from '@ionic-native/native-storage';

// Interface that describe values to initialize the module
export interface ApiAccessConfig {
    apiConfig: string;
    apiDefault: string;
    apiClientId: string;
}

@NgModule({})
export class ApiAccessModule {
    // Returning initialized module
    static forRoot( config: ApiAccessConfig ): ModuleWithProviders {
        return {
            ngModule: ApiAccessModule,
            providers: [
                { provide: ErrorHandler, useClass: IonicErrorHandler },
                { provide: 'apiConfig', useValue: config.apiConfig },
                { provide: 'apiDefault', useValue: config.apiDefault },
                { provide: 'apiClientId', useValue: config.apiClientId },
                Device,
                ApiClientProvider,
                ApiAuthProvider,
                ApiAccessProvider,
                NativeStorage,
            ]
        };
    }
}
