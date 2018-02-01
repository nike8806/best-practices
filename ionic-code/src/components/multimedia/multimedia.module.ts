import { NgModule } from '@angular/core';
import { GeAppAudioComponent } from './ge-app-audio/ge-app-audio.component';
import { GeAppVideoComponent } from './ge-app-video/ge-app-video.component';
import { GeAppImageComponent } from './ge-app-image/ge-app-image.component';
import { GeMediaModule } from '@ge/media';


@NgModule({
    imports: [
        GeMediaModule
    ],
    declarations: [
        GeAppAudioComponent,
        GeAppVideoComponent,
        GeAppImageComponent
    ],
    exports: [
        GeAppAudioComponent,
        GeAppVideoComponent,
        GeAppImageComponent
    ]
})
export class GeAppMultimediaModule {}
