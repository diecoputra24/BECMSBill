import { IsInt, IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateConnectionDto {
    @IsNotEmpty()
    @IsInt()
    pelangganId: number;

    @IsNotEmpty()
    @IsInt()
    paketId: number;

    @IsNotEmpty()
    @IsString()
    @IsIn(['NEW', 'EXISTING', 'NONE'])
    secretMode: 'NEW' | 'EXISTING' | 'NONE';

    @IsOptional()
    @IsString()
    pppUsername?: string;

    @IsOptional()
    @IsString()
    pppPassword?: string;

    @IsOptional()
    @IsString()
    pppService?: string;
}
