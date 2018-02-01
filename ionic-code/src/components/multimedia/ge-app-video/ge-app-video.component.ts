import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BaseMultimediaElement } from '../base-multimedia-element';
import { IElement } from '../../../providers/mission';

@Component({
    selector: 'ge-app-video',
    templateUrl: './ge-app-video.component.html',
    encapsulation: ViewEncapsulation.None
})

export class GeAppVideoComponent extends BaseMultimediaElement {
    @Input() element: IElement;
}
