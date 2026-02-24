import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { RouterModule } from '../router/router.module';

@Module({
    imports: [RouterModule],
    controllers: [CustomerController],
    providers: [CustomerService],
})
export class CustomerModule { }
