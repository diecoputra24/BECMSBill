import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateCustomerStatusRequestDto {
    @IsInt()
    customerId: number;

    @IsString()
    currentStatus: string;

    @IsString()
    @IsIn(['AKTIF', 'NONAKTIF', 'BERHENTI'])
    newStatus: string;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    requestNote?: string;

    @IsString()
    @IsOptional()
    requestedBy?: string;
}

export class ApproveCustomerStatusRequestDto {
    @IsString()
    @IsOptional()
    approvalNote?: string;

    @IsString()
    @IsOptional()
    approvedBy?: string;
}
