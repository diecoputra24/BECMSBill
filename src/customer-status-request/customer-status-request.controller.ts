import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { CustomerStatusRequestService } from './customer-status-request.service';
import { CreateCustomerStatusRequestDto, ApproveCustomerStatusRequestDto } from './dto/customer-status-request.dto';

@Controller('customer-status-request')
export class CustomerStatusRequestController {
    constructor(private readonly service: CustomerStatusRequestService) { }

    @Post()
    create(@Body() dto: CreateCustomerStatusRequestDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('pending') pending?: string) {
        const pendingOnly = pending === 'true';
        return this.service.findAll(pendingOnly);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(+id);
    }

    @Post(':id/approve')
    approve(@Param('id') id: string, @Body() dto: ApproveCustomerStatusRequestDto) {
        return this.service.approve(+id, dto);
    }

    @Post(':id/reject')
    reject(@Param('id') id: string, @Body() dto: ApproveCustomerStatusRequestDto) {
        return this.service.reject(+id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.service.delete(+id);
    }
}
