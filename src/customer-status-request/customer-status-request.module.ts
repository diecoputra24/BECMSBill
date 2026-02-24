import { Module } from '@nestjs/common';
import { CustomerStatusRequestController } from './customer-status-request.controller';
import { CustomerStatusRequestService } from './customer-status-request.service';
import { RouterModule } from '../router/router.module';

@Module({
    imports: [RouterModule],
    controllers: [CustomerStatusRequestController],
    providers: [CustomerStatusRequestService],
    exports: [CustomerStatusRequestService],
})
export class CustomerStatusRequestModule { }
