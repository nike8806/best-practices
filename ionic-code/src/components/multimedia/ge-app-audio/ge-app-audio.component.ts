import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BaseMultimediaElement } from '../base-multimedia-element';
import { IElement } from '../../../providers/mission';

@Component({
    selector: 'ge-app-audio',
    templateUrl: './ge-app-audio.component.html',
    encapsulation: ViewEncapsulation.None
})

export class GeAppAudioComponent extends BaseMultimediaElement {
    @Input() element: IElement;
    @Input() showRewind: boolean = true;

    constructor() {
        super();
    }

}
