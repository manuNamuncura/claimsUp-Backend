export class StatusTransitionDto {
    from: string;
    to: string;
    allowed: boolean;
    requiredFields?: string[];
    conditions?: string[];
}