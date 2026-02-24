import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { BillingTaskService } from './billing-task.service';
import { RouterModule } from '../router/router.module';

@Module({
  imports: [PrismaModule, RouterModule],
  controllers: [InvoiceController],
  providers: [InvoiceService, BillingTaskService],
  exports: [InvoiceService, BillingTaskService],
})
export class InvoiceModule { }
