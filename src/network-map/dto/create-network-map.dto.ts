import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class CreateNetworkMapDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsObject()
    data: any;
}
