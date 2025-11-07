import { Strategy } from 'passport-jwt';
import { Request } from 'express';
interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
declare const JwtRefreshStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    constructor();
    validate(req: Request, payload: JwtPayload): {
        refreshToken: any;
        sub: string;
        email: string;
        role: string;
    };
}
export {};
