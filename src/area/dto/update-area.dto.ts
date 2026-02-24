import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateAreaDto {
    @IsOptional()
    @IsInt()
    branchId?: number;

    @IsOptional()
    @IsString()
    namaArea?: string;

    @IsOptional()
    @IsString()
    kodeArea?: string;
}
