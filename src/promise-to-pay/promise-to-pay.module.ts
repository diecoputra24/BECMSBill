import { Module } from '@nestjs/common';
import { PromiseToPayService } from './promise-to-pay.service';
import { PromiseToPayController } from './promise-to-pay.controller';
import { RouterModule } from '../router/router.module';

@Module({
    imports: [RouterModule],
    controllers: [PromiseToPayController],
    providers: [PromiseToPayService],
    exports: [PromiseToPayService]
})
export class PromiseToPayModule { }
