import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUpgradeRequestDto {
    @IsInt()
    connectionId: number;

    @IsInt()
    customerId: number;

    @IsInt()
    currentPaketId: number;

    @IsInt()
    newPaketId: number;

    @IsString()
    @IsOptional()
    requestNote?: string;

    @IsString()
    @IsOptional()
    requestedBy?: string;
}

export class ApproveUpgradeRequestDto {
    @IsString()
    @IsOptional()
    approvalNote?: string;

    @IsString()
    @IsOptional()
    approvedBy?: string;
}
