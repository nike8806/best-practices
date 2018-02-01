import { ErrorHandler, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicErrorHandler, IonicModule } from 'ionic-angular';
import { NavigationComponent } from './navigation.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    declarations: [NavigationComponent],
    imports: [
        CommonModule,
        IonicModule,
        TranslateModule
    ],
    bootstrap: [],
    exports: [
        NavigationComponent
    ],
    entryComponents: [],
    providers: [
        {provide: ErrorHandler, useClass: IonicErrorHandler},
    ]
})
export class NavigationModule { }
