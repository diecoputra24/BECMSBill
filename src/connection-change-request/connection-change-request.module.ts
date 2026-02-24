import { Module } from '@nestjs/common';
import { ConnectionChangeRequestService } from './connection-change-request.service';
import { ConnectionChangeRequestController } from './connection-change-request.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConnectionModule } from '../connection/connection.module';

@Module({
    imports: [PrismaModule, ConnectionModule],
    controllers: [ConnectionChangeRequestController],
    providers: [ConnectionChangeRequestService],
    exports: [ConnectionChangeRequestService],
})
export class ConnectionChangeRequestModule { }
