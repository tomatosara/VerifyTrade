/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VerifierController } from './../modules/verifier/controller/verifier.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TradeFormController } from './../modules/tradeform/controller/tradeform.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MeTradeFormController } from './../modules/tradeform/controller/me-tradeform.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { IssuerController } from './../modules/issuer/controller/issuer.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../modules/auth/controller/dev-auth.controller';
import { expressAuthentication } from './authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "VerifierQrcodeResponse": {
        "dataType": "refObject",
        "properties": {
            "transactionId": {"dataType":"string","required":true},
            "qrcodeImage": {"dataType":"string","required":true},
            "authUri": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VerifierResultRequest": {
        "dataType": "refObject",
        "properties": {
            "transactionId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TradeFormStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["draft"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["verified"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["done"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "error": {"dataType":"string","required":true},
            "details": {"dataType":"any"},
            "requestId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTradeFormDto": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "amount": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TradeFormStatusValue": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["draft"]},{"dataType":"enum","enums":["pending"]},{"dataType":"enum","enums":["verified"]},{"dataType":"enum","enums":["confirmed"]},{"dataType":"enum","enums":["cancelled"]},{"dataType":"enum","enums":["failed"]},{"dataType":"enum","enums":["done"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AuditEventView": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "tradeUid": {"dataType":"string","required":true},
            "actorId": {"dataType":"string","required":true},
            "action": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["create"]},{"dataType":"enum","enums":["verifyVC"]},{"dataType":"enum","enums":["confirm"]},{"dataType":"enum","enums":["cancel"]},{"dataType":"enum","enums":["finalize"]},{"dataType":"enum","enums":["fail"]},{"dataType":"enum","enums":["retry"]}],"required":true},
            "at": {"dataType":"datetime","required":true},
            "details": {"dataType":"union","subSchemas":[{"ref":"Record_string.unknown_"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TradeFormView": {
        "dataType": "refObject",
        "properties": {
            "uid": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "amount": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "status": {"ref":"TradeFormStatusValue","required":true},
            "creatorId": {"dataType":"string","required":true},
            "counterpartyId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "meta": {"ref":"Record_string.unknown_","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "auditLog": {"dataType":"array","array":{"dataType":"refObject","ref":"AuditEventView"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TradeFormMinimalView": {
        "dataType": "refObject",
        "properties": {
            "uid": {"dataType":"string","required":true},
            "status": {"ref":"TradeFormStatusValue","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VerifyVcDto": {
        "dataType": "refObject",
        "properties": {
            "credential": {"ref":"Record_string.unknown_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ConfirmDto": {
        "dataType": "refObject",
        "properties": {
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user1"]},{"dataType":"enum","enums":["user2"]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CancelDto": {
        "dataType": "refObject",
        "properties": {
            "reason": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FinalizeResult": {
        "dataType": "refObject",
        "properties": {
            "status": {"ref":"TradeFormStatus","required":true},
            "meta": {"ref":"Record_string.unknown_","required":true},
            "error": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TradeFormListItemView": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"TradeFormView"},{"dataType":"nestedObjectLiteral","nestedProperties":{"shareUrl":{"dataType":"string","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Paged_TradeFormListItemView_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"TradeFormListItemView"},"required":true},
            "page": {"dataType":"double","required":true},
            "pageSize": {"dataType":"double","required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TradeFormListResponse": {
        "dataType": "refAlias",
        "type": {"ref":"Paged_TradeFormListItemView_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TradeFormListQueryParams": {
        "dataType": "refObject",
        "properties": {
            "status": {"ref":"TradeFormStatusValue"},
            "created_from": {"dataType":"string"},
            "created_to": {"dataType":"string"},
            "page": {"dataType":"double"},
            "page_size": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "QrcodeDataBody": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "QrcodeNoDataBody": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["platform"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DevTokenResponse": {
        "dataType": "refObject",
        "properties": {
            "token": {"dataType":"string","required":true},
            "expiresIn": {"dataType":"string","required":true},
            "role": {"ref":"UserRole","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DevTokenError": {
        "dataType": "refObject",
        "properties": {
            "error": {"dataType":"string","required":true},
            "requestId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DevTokenRequest": {
        "dataType": "refObject",
        "properties": {
            "userId": {"dataType":"string","required":true},
            "role": {"ref":"UserRole"},
            "email": {"dataType":"string"},
            "name": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsVerifierController_createQrcode: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"ref":{"dataType":"string","required":true}}},
        };
        app.post('/api/v1/verifier/qrcode',
            ...(fetchMiddlewares<RequestHandler>(VerifierController)),
            ...(fetchMiddlewares<RequestHandler>(VerifierController.prototype.createQrcode)),

            async function VerifierController_createQrcode(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVerifierController_createQrcode, request, response });

                const controller = new VerifierController();

              await templateService.apiHandler({
                methodName: 'createQrcode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVerifierController_getResult: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"VerifierResultRequest"},
        };
        app.post('/api/v1/verifier/result',
            ...(fetchMiddlewares<RequestHandler>(VerifierController)),
            ...(fetchMiddlewares<RequestHandler>(VerifierController.prototype.getResult)),

            async function VerifierController_getResult(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVerifierController_getResult, request, response });

                const controller = new VerifierController();

              await templateService.apiHandler({
                methodName: 'getResult',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVerifierController_loginIdCardQrcode: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/verifier/id-card/qrcode',
            ...(fetchMiddlewares<RequestHandler>(VerifierController)),
            ...(fetchMiddlewares<RequestHandler>(VerifierController.prototype.loginIdCardQrcode)),

            async function VerifierController_loginIdCardQrcode(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVerifierController_loginIdCardQrcode, request, response });

                const controller = new VerifierController();

              await templateService.apiHandler({
                methodName: 'loginIdCardQrcode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTradeFormController_createTradeForm: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateTradeFormDto"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/tradeforms',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController.prototype.createTradeForm)),

            async function TradeFormController_createTradeForm(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTradeFormController_createTradeForm, request, response });

                const controller = new TradeFormController();

              await templateService.apiHandler({
                methodName: 'createTradeForm',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTradeFormController_getTradeForm: Record<string, TsoaRoute.ParameterSchema> = {
                uid: {"in":"path","name":"uid","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/tradeforms/:uid',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController.prototype.getTradeForm)),

            async function TradeFormController_getTradeForm(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTradeFormController_getTradeForm, request, response });

                const controller = new TradeFormController();

              await templateService.apiHandler({
                methodName: 'getTradeForm',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTradeFormController_verifyVc: Record<string, TsoaRoute.ParameterSchema> = {
                uid: {"in":"path","name":"uid","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"VerifyVcDto"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/tradeforms/:uid/verify-vc',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController.prototype.verifyVc)),

            async function TradeFormController_verifyVc(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTradeFormController_verifyVc, request, response });

                const controller = new TradeFormController();

              await templateService.apiHandler({
                methodName: 'verifyVc',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTradeFormController_confirmTradeForm: Record<string, TsoaRoute.ParameterSchema> = {
                uid: {"in":"path","name":"uid","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ConfirmDto"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/tradeforms/:uid/confirm',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController.prototype.confirmTradeForm)),

            async function TradeFormController_confirmTradeForm(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTradeFormController_confirmTradeForm, request, response });

                const controller = new TradeFormController();

              await templateService.apiHandler({
                methodName: 'confirmTradeForm',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTradeFormController_cancelTradeForm: Record<string, TsoaRoute.ParameterSchema> = {
                uid: {"in":"path","name":"uid","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"CancelDto"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/tradeforms/:uid/cancel',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController.prototype.cancelTradeForm)),

            async function TradeFormController_cancelTradeForm(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTradeFormController_cancelTradeForm, request, response });

                const controller = new TradeFormController();

              await templateService.apiHandler({
                methodName: 'cancelTradeForm',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTradeFormController_finalizeTradeForm: Record<string, TsoaRoute.ParameterSchema> = {
                uid: {"in":"path","name":"uid","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/tradeforms/:uid/finalize',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController.prototype.finalizeTradeForm)),

            async function TradeFormController_finalizeTradeForm(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTradeFormController_finalizeTradeForm, request, response });

                const controller = new TradeFormController();

              await templateService.apiHandler({
                methodName: 'finalizeTradeForm',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTradeFormController_retryFinalizeTradeForm: Record<string, TsoaRoute.ParameterSchema> = {
                uid: {"in":"path","name":"uid","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/tradeforms/:uid/finalize/retry',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController.prototype.retryFinalizeTradeForm)),

            async function TradeFormController_retryFinalizeTradeForm(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTradeFormController_retryFinalizeTradeForm, request, response });

                const controller = new TradeFormController();

              await templateService.apiHandler({
                methodName: 'retryFinalizeTradeForm',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTradeFormController_getAuditLog: Record<string, TsoaRoute.ParameterSchema> = {
                uid: {"in":"path","name":"uid","required":true,"dataType":"string"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/tradeforms/:uid/audit',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(TradeFormController.prototype.getAuditLog)),

            async function TradeFormController_getAuditLog(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTradeFormController_getAuditLog, request, response });

                const controller = new TradeFormController();

              await templateService.apiHandler({
                methodName: 'getAuditLog',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMeTradeFormController_listMyTradeForms: Record<string, TsoaRoute.ParameterSchema> = {
                rawQuery: {"in":"queries","name":"rawQuery","required":true,"ref":"TradeFormListQueryParams"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/v1/me/tradeforms',
            authenticateMiddleware([{"bearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MeTradeFormController)),
            ...(fetchMiddlewares<RequestHandler>(MeTradeFormController.prototype.listMyTradeForms)),

            async function MeTradeFormController_listMyTradeForms(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMeTradeFormController_listMyTradeForms, request, response });

                const controller = new MeTradeFormController();

              await templateService.apiHandler({
                methodName: 'listMyTradeForms',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIssuerController_qrcodeData: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"QrcodeDataBody"},
        };
        app.post('/api/v1/Issuer/qrcode-data',
            ...(fetchMiddlewares<RequestHandler>(IssuerController)),
            ...(fetchMiddlewares<RequestHandler>(IssuerController.prototype.qrcodeData)),

            async function IssuerController_qrcodeData(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIssuerController_qrcodeData, request, response });

                const controller = new IssuerController();

              await templateService.apiHandler({
                methodName: 'qrcodeData',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIssuerController_qrcodeNoData: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"QrcodeNoDataBody"},
        };
        app.post('/api/v1/Issuer/qrcode-nodata',
            ...(fetchMiddlewares<RequestHandler>(IssuerController)),
            ...(fetchMiddlewares<RequestHandler>(IssuerController.prototype.qrcodeNoData)),

            async function IssuerController_qrcodeNoData(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIssuerController_qrcodeNoData, request, response });

                const controller = new IssuerController();

              await templateService.apiHandler({
                methodName: 'qrcodeNoData',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIssuerController_getCredentialNonce: Record<string, TsoaRoute.ParameterSchema> = {
                transactionId: {"in":"path","name":"transactionId","required":true,"dataType":"string"},
        };
        app.get('/api/v1/Issuer/credential/nonce/:transactionId',
            ...(fetchMiddlewares<RequestHandler>(IssuerController)),
            ...(fetchMiddlewares<RequestHandler>(IssuerController.prototype.getCredentialNonce)),

            async function IssuerController_getCredentialNonce(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIssuerController_getCredentialNonce, request, response });

                const controller = new IssuerController();

              await templateService.apiHandler({
                methodName: 'getCredentialNonce',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_generateDevToken: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"DevTokenRequest"},
        };
        app.post('/api/v1/auth/dev-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.generateDevToken)),

            async function AuthController_generateDevToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_generateDevToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'generateDevToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
