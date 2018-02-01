import { Injectable, Inject } from '@angular/core';
import { ApiAccessConfig } from './api-access.module';
import { Platform } from 'ionic-angular';

@Injectable()
export class ApiAccessProvider {


    private _uuid: any;

    constructor(
        @Inject('apiConfig')
        private readonly apiConfig: ApiAccessConfig,
        @Inject('apiDefault')
        private readonly apiDefaultName: string,
        private platform: Platform
    ) { }

    set deviceUuid(uuid: string) { this._uuid = uuid; }

    /**
     * Getting headers
     * @return {Object} the posible headers in a petition
     */
    get defaultHeaders(): Object {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'GE-Client-Metadata-Id': this._uuid
        };
    }

    /**
     * Making an endpoint URL
     * @return {string} with url
     */
    getEndPointUrl(endpoint: string, apiName: string = this.apiDefaultName): string {
         let api = this.apiConfig[apiName];
         return `${api.host}/${api.prefix}/${endpoint}`;
     }
}
