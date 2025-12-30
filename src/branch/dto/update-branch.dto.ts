import { IsString, IsOptional } from 'class-validator';

export class UpdateBranchDto {
    @IsOptional()
    @IsString()
    namaBranch?: string;

    @IsOptional()
    @IsString()
    alamatBranch?: string;
}
