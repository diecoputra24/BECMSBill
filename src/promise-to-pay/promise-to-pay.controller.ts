import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PromiseToPayService } from './promise-to-pay.service';
import { CreatePromiseDto } from './dto/create-promise.dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@Controller('promise-to-pay')
@UseGuards(AuthGuard, RolesGuard)
@Roles('FINANCE', 'ADMIN')
export class PromiseToPayController {
    constructor(private readonly promiseToPayService: PromiseToPayService) { }

    @Post()
    create(@Body() createPromiseDto: CreatePromiseDto) {
        return this.promiseToPayService.create(createPromiseDto);
    }

    @Get()
    findAll(@User() user: any) {
        return this.promiseToPayService.findAll(user);
    }

    @Get('customer/:customerId')
    findByCustomer(@Param('customerId') customerId: string) {
        return this.promiseToPayService.findByCustomer(+customerId);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.promiseToPayService.remove(+id);
    }
}
