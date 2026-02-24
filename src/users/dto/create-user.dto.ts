import { IsEmail, IsOptional, IsString, IsArray, IsInt, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(3)
    username: string;

    @IsString()
    @MinLength(8)
    @IsOptional()
    password?: string; // Optional if created without password initially (e.g. invite) but usually required

    @IsInt()
    @IsOptional()
    roleId?: number;

    @IsInt()
    @IsOptional()
    branchId?: number;

    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    areaIds?: number[];

    @IsString()
    @IsOptional()
    theme?: string;

    @IsString()
    @IsOptional()
    position?: string;

    @IsInt()
    @IsOptional()
    vendorId?: number;
}
