import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVendorDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    address?: string;
}
