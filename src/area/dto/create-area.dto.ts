import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateAreaDto {
    @IsNotEmpty()
    @IsInt()
    branchId: number;

    @IsNotEmpty()
    @IsString()
    namaArea: string;

    @IsNotEmpty()
    @IsString()
    kodeArea: string;
}
