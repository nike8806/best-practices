import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LoginPage } from './login';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Config } from '../../config/config';

@NgModule({
    declarations: [
        LoginPage,
    ],
    imports: [
        IonicPageModule.forChild(LoginPage),
        TranslateModule,
        FlexLayoutModule
    ],
    entryComponents: [
        LoginPage
    ],
    providers: [
        InAppBrowser,
        {
            provide: 'forgottenPasswordURL',
            useValue: Config.get('externalUrl.forgotPassword'),
        }
    ]
})
export class LoginPageModule {}
