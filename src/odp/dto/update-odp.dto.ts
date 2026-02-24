import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateOdpDto {
    @IsOptional()
    @IsInt()
    areaId?: number;

    @IsOptional()
    @IsString()
    namaOdp?: string;

    @IsOptional()
    @IsInt()
    portOdp?: number;

    @IsOptional()
    @IsNumber()
    latOdp?: number;

    @IsOptional()
    @IsNumber()
    longOdp?: number;
}
