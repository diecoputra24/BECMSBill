import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateRouterDto {
    @IsOptional()
    @IsString()
    namaRouter?: string;

    @IsOptional()
    @IsString()
    hostAddress?: string;

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    password?: string;

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
