import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOdpDto {
    @IsNotEmpty()
    @IsInt()
    areaId: number;

    @IsNotEmpty()
    @IsString()
    namaOdp: string;

    @IsNotEmpty()
    @IsInt()
    portOdp: number;

    @IsNotEmpty()
    @IsNumber()
    latOdp: number;

    @IsNotEmpty()
    @IsNumber()
    longOdp: number;
}
