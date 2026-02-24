import { IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
    @IsOptional()
    @IsString()
    idPelanggan?: string;

    @IsNotEmpty()
    @IsString()
    namaPelanggan: string;

    @IsNotEmpty()
    @IsString()
    alamatPelanggan: string;

    @IsNotEmpty()
    @IsString()
    teleponPelanggan: string;

    @IsNotEmpty()
    @IsString()
    identitasPelanggan: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsNotEmpty()
    @IsInt()
    areaId: number;

    @IsOptional()
    @IsInt()
    odpId?: number;

    @IsOptional()
    @IsInt()
    odpPortId?: number;

    @IsOptional()
    @IsString()
    statusPelanggan?: string;

    @IsOptional()
    @IsDateString()
    tanggalAktif?: string;

    @IsOptional()
    @IsDateString()
    tanggalAkhir?: string;

    @IsOptional()
    @IsDateString()
    tanggalToleransi?: string;

    @IsOptional()
    @IsNumber()
    diskon?: number;

    @IsOptional()
    @IsBoolean()
    useTax?: boolean;

    @IsOptional()
    @IsInt()
    taxId?: number;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    addonIds?: number[];
}
