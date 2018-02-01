import {
    EventEmitter
} from '@angular/core';
import { IElement } from '../../providers/mission';

export interface GeElement {
    element: IElement;
}

export abstract class BaseMultimediaElement implements GeElement  {

    abstract element: IElement;

    public ready = new EventEmitter();
    constructor() {
    }

    /*
     * Indicate when the element was loaded
     */
    onLoaded() {
        this.ready.emit(this);
    }

}
