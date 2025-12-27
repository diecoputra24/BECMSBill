import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePackageDto {
    @IsNotEmpty()
    @IsNumber()
    routerId: number;

    @IsNotEmpty()
    @IsString()
    namaPaket: string;

    @IsNotEmpty()
    @IsNumber()
    hargaPaket: number;

    @IsNotEmpty()
    @IsString()
    mikrotikProfile: string;

    @IsOptional()
    @IsBoolean()
    displayPaket?: boolean;

    @IsOptional()
    @IsString()
    deskripsi?: string;
}
