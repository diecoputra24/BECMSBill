import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBranchDto {
    @IsNotEmpty()
    @IsString()
    namaBranch: string;

    @IsNotEmpty()
    @IsString()
    alamatBranch: string;
}
