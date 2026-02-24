import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { BillingTaskService } from './billing-task.service';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@Controller('invoice')
@UseGuards(AuthGuard, RolesGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly billingTaskService: BillingTaskService
  ) { }

  @Post()
  @Roles('FINANCE', 'ADMIN')
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get('batch-info')
  @Roles('TEKNISI', 'FINANCE', 'ADMIN')
  getBatchInfo(@User() user: any) {
    return this.invoiceService.getBatchGenerateInfo(user);
  }

  @Post('generate-batch')
  @Roles('FINANCE', 'ADMIN')
  generateBatch(@User() user: any) {
    return this.invoiceService.generateBatch(user);
  }

  @Post('generate-next-month/:customerId')
  @Roles('FINANCE', 'ADMIN')
  generateNextMonth(@Param('customerId') customerId: string) {
    return this.invoiceService.generateNextMonth(+customerId);
  }

  @Post(':id/recalculate')
  @Roles('FINANCE', 'ADMIN')
  recalculate(@Param('id') id: string) {
    return this.invoiceService.recalculate(+id);
  }

  @Post('run-isolation')
  @Roles('FINANCE', 'ADMIN')
  runIsolation() {
    return this.billingTaskService.runIsolationProcess();
  }

  @Get()
  @Roles('TEKNISI', 'FINANCE', 'ADMIN')
  findAll(@User() user: any) {
    return this.invoiceService.findAll(user);
  }

  @Get(':id')
  @Roles('TEKNISI', 'FINANCE', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(+id);
  }

  @Patch(':id')
  @Roles('FINANCE', 'ADMIN')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(+id, updateInvoiceDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(+id);
  }
}
