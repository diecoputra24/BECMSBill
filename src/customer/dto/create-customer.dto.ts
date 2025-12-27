import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
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

    @IsNotEmpty()
    @IsInt()
    areaId: number;

    @IsNotEmpty()
    @IsInt()
    odpId: number;

    @IsNotEmpty()
    @IsInt()
    odpPortId: number;

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
}
