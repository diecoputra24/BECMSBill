import { Module } from '@nestjs/common';
import { OdpService } from './odp.service';
import { OdpController } from './odp.controller';

@Module({
    controllers: [OdpController],
    providers: [OdpService],
})
export class OdpModule { }
