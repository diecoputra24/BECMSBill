import { Module } from '@nestjs/common';
import { CustomerChangeRequestService } from './customer-change-request.service';
import { CustomerChangeRequestController } from './customer-change-request.controller';

@Module({
    controllers: [CustomerChangeRequestController],
    providers: [CustomerChangeRequestService],
    exports: [CustomerChangeRequestService],
})
export class CustomerChangeRequestModule { }
