import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRouterDto {
    @IsNotEmpty()
    @IsString()
    namaRouter: string;

    @IsNotEmpty()
    @IsString()
    hostAddress: string;

    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    @IsInt()
    apiPort?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isolir?: boolean;

    @IsOptional()
    @IsString()
    isolirProfile?: string;

    @IsOptional()
    @IsString()
    isolirScheme?: string;
}
