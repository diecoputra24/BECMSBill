import { IsInt, IsOptional, IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreatePromiseDto {
    @IsInt()
    @IsNotEmpty()
    customerId: number;

    @IsInt()
    @IsOptional()
    invoiceId?: number;

    @IsDateString()
    @IsNotEmpty()
    promiseDate: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsNotEmpty()
    adminId: string;
}
