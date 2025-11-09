export declare class MailService {
    constructor();
    sendVerificationCode(email: string, code: string): Promise<void>;
}
