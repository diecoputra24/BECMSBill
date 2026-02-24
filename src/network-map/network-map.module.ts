import { Module } from '@nestjs/common';
import { NetworkMapService } from './network-map.service';
import { NetworkMapController } from './network-map.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [NetworkMapController],
    providers: [NetworkMapService],
})
export class NetworkMapModule { }
