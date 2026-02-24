import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCustomerChangeRequestDto {
    @IsInt()
    customerId: number;

    // Current values (snapshot at request time)
    @IsString()
    currentNama: string;

    @IsString()
    currentAlamat: string;

    @IsString()
    currentTelepon: string;

    @IsString()
    currentIdentitas: string;

    @IsInt()
    currentAreaId: number;

    @IsInt()
    @IsOptional()
    currentOdpId?: number;

    @IsInt()
    @IsOptional()
    currentOdpPortId?: number;

    @IsNumber()
    @IsOptional()
    currentLatitude?: number;

    @IsNumber()
    @IsOptional()
    currentLongitude?: number;

    // New values (requested changes)
    @IsString()
    newNama: string;

    @IsString()
    newAlamat: string;

    @IsString()
    newTelepon: string;

    @IsString()
    newIdentitas: string;

    @IsInt()
    newAreaId: number;

    @IsInt()
    @IsOptional()
    newOdpId?: number;

    @IsInt()
    @IsOptional()
    newOdpPortId?: number;

    @IsNumber()
    @IsOptional()
    newLatitude?: number;

    @IsNumber()
    @IsOptional()
    newLongitude?: number;

    @IsString()
    @IsOptional()
    requestNote?: string;

    @IsString()
    @IsOptional()
    requestedBy?: string;
}

export class ApproveCustomerChangeRequestDto {
    @IsString()
    @IsOptional()
    approvalNote?: string;

    @IsString()
    @IsOptional()
    approvedBy?: string;
}
