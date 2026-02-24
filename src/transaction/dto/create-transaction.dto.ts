import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTransactionDto {
    @IsArray()
    @IsNotEmpty()
    invoiceIds: number[];

    @IsString()
    @IsOptional()
    adminId?: string;

    @IsString()
    @IsOptional()
    paymentMethod?: string; // Default 'CASH'

    @IsNumber()
    @IsNotEmpty()
    amountPaid: number;

    @IsNumber()
    @IsOptional()
    customerId?: number;

    @IsString()
    @IsOptional()
    proofImage?: string; // Base64 encoded image for TRANSFER/EWALLET proof
}

