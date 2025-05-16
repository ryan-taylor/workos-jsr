/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise.ts';
import { OpenAPI } from '../core/OpenAPI.ts';
import { request as __request } from '../core/request.ts';
export class DefaultService {
    /**
     * @returns any Success
     * @throws ApiError
     */
    public static getSecured(): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/secure',
        });
    }
}
