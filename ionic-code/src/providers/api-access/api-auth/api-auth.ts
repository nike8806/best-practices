import { Injectable, EventEmitter, Inject } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { AccessInfoInterface } from '../access-info.model';
import { ApiAccessProvider } from '../api-access';
import { NativeStorage } from '@ionic-native/native-storage';
import { GeLoggerProvider } from '../../ge-logger';
import { GeNetworkProvider } from '../../ge-network';
import * as stackTrace from 'stacktrace-js';
import * as _ from 'lodash';

@Injectable()
export class ApiAuthProvider {

    private _accessInfo: AccessInfoInterface = null;

    onErrorRefreshToken = new EventEmitter<any>();

    private readonly LOGIN_CONTENT_TYPE = 'application/x-www-form-urlencoded';
    constructor(
        @Inject('apiClientId') private readonly apiClientId: string,
        private _http: Http,
        private _apiAccessService: ApiAccessProvider,
        private _nativeStorage: NativeStorage,
        private _geLoggerProvider: GeLoggerProvider,
        private _geNetworkProvider: GeNetworkProvider
    ) { }

    /**
     * Check if the user is signed
     * return boolean indicating if the service has a valid accesInfo
     */
    isSignedIn(): boolean {
        return this._accessInfo !== null;
    }

    /**
     * Check if the usser accessInfo is saved in the device
     * if is saved we add acessinfo in authProvider
     */
    getAccessInfo(): Observable<any> {
        return Observable.fromPromise(this._nativeStorage.getItem('accesInfo')).map(
            (data) => {
                this._geLoggerProvider.debug('AccessInfo from native storage is ready.');
                this._accessInfo = <AccessInfoInterface> data;
                return Observable.of(data);
            }
        ).catch((err) => {
            this._geLoggerProvider.debug('AccessInfo was not found in localstorage', err);
            return Observable.throw(err);
        });
    }

    /**
     * Log in user
     */
    login(username: string, password: string): Observable<AccessInfoInterface> {
        return this._http.post(
            this._apiAccessService.getEndPointUrl('login'),
            [
                `username=${username}`,
                `password=${password}`,
                `client_id=${this.apiClientId}`,
                'grant_type=password'
            ].join('&'),
            this._getRequestOptions({ 'Content-Type': this.LOGIN_CONTENT_TYPE })
        ).map((res: any) => this._buildAccessInfoFromResponse(res))
         .catch((error: any) => this._httpErrorResponseHandler(error));
    }

    /**
     * Checking if the user is signed
     */
    logout(): Observable<any> {
        if (!this.isSignedIn()) {
            this.onErrorRefreshToken.emit();
            return Observable.of('Error with Logout');
        }
        // Use refresh tokem in headers
        return this._http.post(
            this._apiAccessService.getEndPointUrl('logout'),
            [
                'token_type_hint=access_token',
                `client_id=${this.apiClientId}`,
                `token=${this._accessInfo.access_token}`
            ].join('&'),
            this._getRequestOptions(
                { 'Content-Type': this.LOGIN_CONTENT_TYPE }
            )
        ).map((res: any) => this.removeAccessInfo(res))
         .catch((error: any) => this._httpErrorResponseHandler(error));
    }

    private _httpErrorResponseHandler(error: any) {
        if (this._geNetworkProvider.isOffline) {
            error.status = -2;
        }
        return Observable.throw(error);
    }

    /**
    * Generic extract the data response
    */
    private removeAccessInfo(res: Response) {
        // removing accesInfo
        this._accessInfo = null;

        // ================================================================
        // TODO========> CONVERT IN OBSERVABLE TO CATCH THE ERROR
        // ================================================================
        // Removing accessInfo from Native Storage
        this._nativeStorage.remove('accesInfo').then(
            data => this._geLoggerProvider.info('AccessInfo removed: ', data),
            error => {
                let stack;
                stackTrace
                    .get({ offline: true }).then(_stack => stack = _stack)
                    .catch(err => this._geLoggerProvider.addLog(err, 'ERROR GETTING STACK'))
                    .then(() => this._geLoggerProvider.error('An error has ocurred removing AccessInfo', error, stack));
            }
          );

        // Need to check that there is actually a body to return
        // (logout service does not answer anything).
        // It makes the assumption that any content in the body of the response is
        // a valid json.
        let body = res.text() !== '' ? res.json() : {};
        // Returns body response
        return  body;
    }

    /**
     * Refresh user access_token
     * send a request to api for refresh token
     */
    refreshAccessToken(): Observable <any> {
        // Return observable to indicate if it was updated
        return this._http.post(
            this._apiAccessService.getEndPointUrl('login'),
            [
                `client_id=${this.apiClientId}`,
                `grant_type=refresh_token`,
                `refresh_token=${this._accessInfo.refresh_token}`
            ].join('&'),
            this._getRequestOptions(
                this._getAuthorizationRefreshTokenHeader()
            )
        ).map((res: any) => {
            return this._buildAccessInfoFromResponse(res);
        }).catch((error: any) => {
            if (this._geNetworkProvider.isOffline) {
                error.status = -2;
                return Observable.throw(error);
            }

            // Removing old access info from the device
            this.removeAccessInfo(error);
            // if we have an invalid_grant we set a  401 (Unauthorized) status
            let body = error.text() !== '' ? error.json() : {};
            if (_.get(body, 'error') === 'invalid_grant') {
                error.status = 401;
            }
            // Emit event to execute the exception
            this.onErrorRefreshToken.emit(error);
            return Observable.throw(error);
        });
    }

    /**
     * Checking if the access token has expired
     */
    isAccessTokenExpired(): boolean {
        // Checking if accessInfo is diferent of null
        if (!this.accessInfo) {
            return true;
        }
        return new Date(this._accessInfo.expiration_in) < new Date();
    }

    /**
     * Setting access info from response
     * parsing response and set accessInfo value
     */
    private _buildAccessInfoFromResponse(res: any): AccessInfoInterface {
        let expirationDate = new Date();
        let expirationTime: number;
        this._accessInfo = res.json() || null;

        // getTime works with milliseconds
        expirationTime = (new Date()).getTime() +
            this.accessInfo.expires_in * 1000;
        expirationDate.setTime(expirationTime);

        this._accessInfo.expiration_in = expirationDate;

        // ================================================================
        // TODO========> CONVERT IN OBSERVABLE TO CATCH THE ERROR
        // ================================================================
        // Adding accessInfo to native Storage
        this._nativeStorage.setItem('accesInfo', this._accessInfo).then(
            () => this._geLoggerProvider.info('AccessInfo removed: '),
            error => {
                let stack;
                stackTrace
                    .get({ offline: true }).then(_stack => stack = _stack)
                    .catch(err => this._geLoggerProvider.addLog(err, 'ERROR GETTING STACK'))
                    .then(() => this._geLoggerProvider.error('Error storing accessInfo', error, stack));
            }
          );

        return this._accessInfo;
    }

    /**
     * Getting access info to include where be necessary
     */
    get accessInfo(): AccessInfoInterface {
        return this._accessInfo;
    }

    /**
     * Creating headers
     * return header options
     */
    private _getRequestOptions(optionalHeaders = {}) {
        // Setting headers and add new headers if the input headers has value
        let headers = Object.assign({}, this._apiAccessService.defaultHeaders, optionalHeaders);
        // Setting options
        return new RequestOptions({headers: new Headers(headers)});
    }

    /**
      * Build the object header for autorization
      * return an autorization object to merge with header
      */
    private _getAuthorizationRefreshTokenHeader() {
        let authorization = `${this._accessInfo.token_type} ${this._accessInfo.refresh_token}`;
        return {
            'Content-Type': this.LOGIN_CONTENT_TYPE,
            'Authorization': authorization
        };
    }
}
