import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceItemDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    itemType: string; // 'PACKAGE', 'ADDON', 'DISCOUNT'

    @IsNumber()
    amount: number;
}

export class CreateInvoiceDto {
    @IsNumber()
    @IsNotEmpty()
    customerId: number;

    @IsDateString()
    @IsNotEmpty()
    period: string; // ISO Date string (e.g., 2024-01-01)

    @IsString()
    @IsOptional()
    category?: string; // Default: RECURRING

    @IsString()
    @IsOptional()
    type?: string; // Default: PREPAID

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items: InvoiceItemDto[];

    @IsOptional()
    @IsDateString()
    tanggalJatuhTempo?: string;

    @IsOptional()
    @IsNumber()
    hariToleransi?: number;
}

