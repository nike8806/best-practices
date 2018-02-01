import { Response } from '@angular/http';

export class ApiClientError extends Error {

    public response: Response;

    public get status(): number {
        if (!this.response) {
            return -1;
        }
        return this.response.status;
    }

    constructor(messageOrResponse: string | Response) {
        super(messageOrResponse.toString());

        if (messageOrResponse instanceof Response) {
            this.response = messageOrResponse;
        }
        Object.setPrototypeOf(this, ApiClientError.prototype);
    }
}
