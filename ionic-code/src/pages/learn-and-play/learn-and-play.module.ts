import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { LearnAndPlayPage } from './learn-and-play';
import { MissionModule } from './../../components/mission/mission.module';

@NgModule({
    declarations: [
        LearnAndPlayPage,
    ],
    imports: [
        IonicPageModule.forChild(LearnAndPlayPage),
        TranslateModule,
        FlexLayoutModule,
        MissionModule
    ],
    entryComponents: [
        LearnAndPlayPage
    ]
})
export class LearnAndPlayPageModule {}
