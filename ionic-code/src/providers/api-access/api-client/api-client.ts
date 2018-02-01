import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers, ResponseOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import * as _ from 'lodash';
import { ApiAuthProvider } from '../api-auth/api-auth';
import { ApiAccessProvider } from '../api-access';
import { ApiClientError } from './api-client-error';
import { GeNetworkProvider } from '../../ge-network';

@Injectable()
export class ApiClientProvider {

    private _REQUEST_TIMEOUT: number = 15000;

    private readonly  _LIMIT_OF_ATTEMPTS = 2;

    constructor(
        private _http: Http,
        private _apiAuthService: ApiAuthProvider,
        private _apiAccessService: ApiAccessProvider,
        private _geNetworkProvider: GeNetworkProvider
    ) {}

    /**
     * Performs a request with `get` http method.
     */
    get(path: string, options?: RequestOptions, attempt = 0, apiName?: string): Observable<any> {
        let isAnInvalidAttempt = this._isAnInvalidAttempt(attempt);
        if (isAnInvalidAttempt.result) {
            return this._onErrorReponseHandler(this._newErrorResponse(-3, isAnInvalidAttempt.text));
        }

        if (this._geNetworkProvider.isOffline) {
            return this._onErrorReponseHandler(this._newErrorResponse(-2, 'No conection'));
        }

        let request = () => {
            return this.addRequestTimeout(this._http.get(
                this._apiAccessService.getEndPointUrl(path, apiName),
                this._getRequestOptions(options)
            ).catch((error: any) =>
                this._requestErrorHandler(
                    'get',
                    error,
                    {
                        path: path,
                        options: options,
                        body: null,
                        attempt: attempt + 1,
                        apiName: apiName
                    })
                ));
        };

        return this._executePetition(request);
    }

    /**
     * Performs a request with `post` http method.
     */
    post(path: string, body: any, options?: RequestOptions, attempt = 0, apiName?: string): Observable<Response> {
        let isAnInvalidAttempt = this._isAnInvalidAttempt(attempt);
        if (isAnInvalidAttempt.result) {
            return this._onErrorReponseHandler(this._newErrorResponse(-3, isAnInvalidAttempt.text));
        }

        if (this._geNetworkProvider.isOffline) {
            return this._onErrorReponseHandler(this._newErrorResponse(-2, 'No conection'));
        }

        let request = () => {
            return this.addRequestTimeout(this._http.post(
                this._apiAccessService.getEndPointUrl(path, apiName),
                body,
                this._getRequestOptions(options)
            ).catch((error: Response) =>
                this._requestErrorHandler(
                    'post',
                    error,
                    {
                        path: path,
                        options: options,
                        body: body,
                        attempt: attempt + 1,
                        apiName: apiName
                    })
            ));
        };

        return this._executePetition(request);
    }

    /**
     * Performs a request with `put` http method.
     */
    put(path: string, body: any, options?: RequestOptions, attempt = 0, apiName?: string): Observable<Response> {
        let isAnInvalidAttempt = this._isAnInvalidAttempt(attempt);
        if (isAnInvalidAttempt.result) {
            return this._onErrorReponseHandler(this._newErrorResponse(-3, isAnInvalidAttempt.text));
        }

        if (this._geNetworkProvider.isOffline) {
            return this._onErrorReponseHandler(this._newErrorResponse(-2, 'No conection'));
        }

        let request = () => {
            return this.addRequestTimeout(this._http.put(
                this._apiAccessService.getEndPointUrl(path, apiName),
                body,
                this._getRequestOptions(options)
            ).catch((error: any) =>
                this._requestErrorHandler(
                    'put',
                    error,
                    {
                        path: path,
                        options: options,
                        body: body,
                        attempt: attempt + 1,
                        apiName: apiName
                    })
            ));
        };

        return this._executePetition(request);
    }

    /**
     * Performs a request with `delete` http method.
     */
    delete(path: string, options?: RequestOptions, attempt = 0, apiName?: string): Observable<Response> {
        let isAnInvalidAttempt = this._isAnInvalidAttempt(attempt);
        if (isAnInvalidAttempt.result) {
            return this._onErrorReponseHandler(this._newErrorResponse(-3, isAnInvalidAttempt.text));
        }

        if (this._geNetworkProvider.isOffline) {
            return this._onErrorReponseHandler(this._newErrorResponse(-2, 'No conection'));
        }

        let request = () => {
            return this._http.delete(
                        this._apiAccessService.getEndPointUrl(path, apiName),
                        this._getRequestOptions(options)
                    ).catch((error: any) =>
                        this._requestErrorHandler(
                                'delete',
                                error,
                                // Params to resend 
                                {
                                    path: path,
                                    apiName: apiName,
                                    options: options,
                                    body: null,
                                    attempt: attempt + 1
                                }
                            ));
        };

        return this._executePetition(request);
    }

    private addRequestTimeout(observable: Observable<Response>): Observable<Response> {
        let callback = () => this._onErrorReponseHandler(this._newErrorResponse(-1, 'Timeout error.'));

        return observable
            .timeoutWith(this._REQUEST_TIMEOUT, Observable.defer(callback));
    }
    /*
     * Return new error response
     */
    private _newErrorResponse(status: number, message: string): Response {
        let resOptions = new ResponseOptions({
            status: status,
            body: {message: message}
        });
        return new Response(resOptions);
    }

    /**
     * Eval and execute the request, and if the token has expired execute
     * the refreshToken function and the original request,
     * but if the token hasn't expired then execute only the original request
     * @param {function} request Is a callback to execute
     */
    private _executePetition(request): Observable <any> {
        return this._apiAuthService.isAccessTokenExpired()
                ? this._tokenExpired(request)
                : request();
    }

    /**
     * Checking if the attempt doesn't exced the limit of attempts
     * @param {number} attempt Is the number of attempt of the request
     */
    private _isAnInvalidAttempt(attempt: number): { text: string, result: boolean } {
        if (!this._apiAuthService.isSignedIn()) {
            return { text: 'User not Signed', result: true };
        }

        if (attempt > this._LIMIT_OF_ATTEMPTS) {
            return { text: 'Maximun retry attempts exceeded', result: true };
        }

        return { text: 'Valid attempt', result: false };
    }

    /**
     * Handling the request errors
     * @param {string} method Is the method to call in this class
     * @param {Response} error Is the error response to evaluate
     * @param {Object} Is the method params to send in the method execution
     */
    private _requestErrorHandler(
        method: string,
        error: any,
        methodParams: { path: string,
                        options: RequestOptions,
                        body: any,
                        attempt: number,
                        apiName: string
                        },
        ): Observable<any> {

        // Validating the status error
        // check if we have a 401 (Unauthorized) or 403 (Forbiden)
        if ([401, 403].find((e) => error.status === e)) {
            // Creating params to method to call and if body param is null is removed
            let params = [methodParams.path,
                          methodParams.options,
                          methodParams.body,
                          methodParams.attempt,
                          methodParams.apiName].filter((param) => param !== null);

            // Building the method request
            // Sending the params with spread operator
            let request = () => {
                return this[method](...params);
            };

            //  Renovating the access Token
            return this._tokenExpired(request);
        }

        // if we have other status we make a trow
        return this._onErrorReponseHandler(error);
    }

    /**
     *  Calling to Refresh the accessToken.
     *  When the refreshToken call has finished, the request received is called
     */
    private _tokenExpired(request: any): Observable<any> {
        return this._apiAuthService.refreshAccessToken().flatMap(
            (res) => {
                return this.addRequestTimeout(request());
            } );
    }

    /**
     * Creating headers
     * @return {RequestOptions} header options
     */
    private _getRequestOptions(options: RequestOptions = new RequestOptions()) {
        // adding  autorization header to make requests and overwriting if is necesary,
        let headers = _.defaults(
            this._apiAccessService.defaultHeaders,
            this._getAuthorizationAccessTokenHeader(),
            options.headers
        );
        return options.merge({headers: new Headers(headers)});
    }

    /**
     * Execute throw when an error occurs
     * @param {any} error to send
     */
    private _onErrorReponseHandler(error: any): Observable<any> {
        return Observable.throw(new ApiClientError(error));
    }

    /**
      * Build the object header for authorization with accessToken
      * @return {Object} an autorization object to merge with header
      */
    private _getAuthorizationAccessTokenHeader() {
        let authorization =
            (this._apiAuthService.accessInfo) ? `${this._apiAuthService.accessInfo.token_type} ${this._apiAuthService.accessInfo.access_token}`
                                              : '';

        return {'Authorization': authorization};
    }
}
