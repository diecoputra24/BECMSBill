import { Module } from '@nestjs/common';
import { UpgradeRequestService } from './upgrade-request.service';
import { UpgradeRequestController } from './upgrade-request.controller';
import { ConnectionModule } from '../connection/connection.module';

@Module({
    imports: [ConnectionModule],
    controllers: [UpgradeRequestController],
    providers: [UpgradeRequestService],
    exports: [UpgradeRequestService],
})
export class UpgradeRequestModule { }
