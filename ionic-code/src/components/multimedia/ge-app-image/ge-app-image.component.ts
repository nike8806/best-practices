import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BaseMultimediaElement } from '../base-multimedia-element';
import { IElement } from '../../../providers/mission';

@Component({
    selector: 'ge-app-image',
    templateUrl: './ge-app-image.component.html',
    encapsulation: ViewEncapsulation.None
})

export class GeAppImageComponent extends BaseMultimediaElement {
    @Input() element: IElement;
    @Input() showRewind: boolean = true;
}
