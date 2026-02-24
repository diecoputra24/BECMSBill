import { PartialType } from '@nestjs/mapped-types';
import { CreateNetworkMapDto } from './create-network-map.dto';

export class UpdateNetworkMapDto extends PartialType(CreateNetworkMapDto) { }
