import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateConnectionDto {
    @IsNotEmpty()
    @IsInt()
    pelangganId: number;

    @IsNotEmpty()
    @IsInt()
    paketId: number;

    @IsNotEmpty()
    @IsString()
    pppUsername: string;

    @IsNotEmpty()
    @IsString()
    pppPassword: string;

    @IsNotEmpty()
    @IsString()
    pppService: string;
}
