import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CustomerChangeRequestService } from './customer-change-request.service';
import { CreateCustomerChangeRequestDto, ApproveCustomerChangeRequestDto } from './dto/customer-change-request.dto';

@Controller('customer-change-request')
export class CustomerChangeRequestController {
    constructor(private readonly service: CustomerChangeRequestService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get('pending')
    findPending() {
        return this.service.findPending();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateCustomerChangeRequestDto) {
        return this.service.create(dto);
    }

    @Patch(':id/approve')
    approve(@Param('id', ParseIntPipe) id: number, @Body() dto: ApproveCustomerChangeRequestDto) {
        return this.service.approve(id, dto);
    }

    @Patch(':id/reject')
    reject(@Param('id', ParseIntPipe) id: number, @Body() dto: ApproveCustomerChangeRequestDto) {
        return this.service.reject(id, dto);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.service.delete(id);
    }
}
