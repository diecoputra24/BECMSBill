import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateTaxDto {
    @IsString()
    name: string;

    @IsNumber()
    value: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
