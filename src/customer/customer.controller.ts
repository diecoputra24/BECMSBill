import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@Controller('customer')
@UseGuards(AuthGuard, RolesGuard)
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Post()
    @Roles('ADMIN', 'FINANCE', 'customer.create')
    create(@Body() createCustomerDto: CreateCustomerDto) {
        return this.customerService.create(createCustomerDto);
    }

    @Get()
    @Roles('ADMIN', 'FINANCE', 'TEKNISI', 'customer.list', 'customer.view')
    findAll(@User() user: any) {
        return this.customerService.findAll(user);
    }

    @Get(':id')
    @Roles('ADMIN', 'FINANCE', 'TEKNISI', 'customer.view')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.customerService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN', 'FINANCE', 'customer.change')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateData: Partial<CreateCustomerDto>) {
        return this.customerService.update(id, updateData);
    }

    @Delete(':id')
    @Roles('ADMIN', 'customer.delete')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.customerService.remove(id);
    }
}
