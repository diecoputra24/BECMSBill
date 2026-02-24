import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsInt, IsArray } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
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
}
