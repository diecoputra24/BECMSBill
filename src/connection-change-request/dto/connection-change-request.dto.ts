import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';

export class CreateConnectionChangeRequestDto {
    @IsInt()
    connectionId: number;

    @IsInt()
    customerId: number;

    @IsString()
    @IsOptional()
    currentPppUsername?: string;

    @IsString()
    @IsOptional()
    currentPppPassword?: string;

    @IsString()
    @IsOptional()
    currentPppService?: string;

    @IsString()
    @IsOptional()
    currentSecretMode?: string;

    @IsInt()
    @IsOptional()
    currentPaketId?: number;

    @IsString()
    @IsOptional()
    newPppUsername?: string;

    @IsString()
    @IsOptional()
    newPppPassword?: string;

    @IsString()
    @IsOptional()
    newPppService?: string;

    @IsString()
    @IsOptional()
    newSecretMode?: string;

    @IsInt()
    @IsOptional()
    newPaketId?: number;

    @IsString()
    @IsOptional()
    requestNote?: string;

    @IsString()
    @IsOptional()
    requestedBy?: string;
}

export class ApproveConnectionChangeRequestDto {
    @IsString()
    @IsOptional()
    approvalNote?: string;

    @IsString()
    @IsOptional()
    approvedBy?: string;
}
