import { Component, ViewChild, Input, OnInit } from '@angular/core';
import { Platform, Nav, Tabs } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

import { NavigationPageItem } from './navigation-page-item.model';

@Component({
    selector: 'navigation-component',
    templateUrl: './navigation.component.html',
})
export class NavigationComponent implements OnInit {
    // Catching pages variable
    @Input('pages') pages: NavigationPageItem[];
    @ViewChild(Nav) nav: Nav;
    @ViewChild('myTabs') tabRef: Tabs;
    page = 'login';
    constructor(
        public platform: Platform,
        public translate: TranslateService
    ) {    }

    /**
     * Getting ionChangeEvent of tabs
     */
    ngOnInit() {
        this.tabRef.ionChange.subscribe((p) => this.onChange(p));
    }

    /**
     * Setting the value of the page
     */
    onChange(p) {
        return this.page = p.root;
    }
}
