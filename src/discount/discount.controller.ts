import { Controller, Get, Param } from '@nestjs/common';
import { DiscountService } from './discount.service';

@Controller('discount')
export class DiscountController {
    constructor(private readonly discountService: DiscountService) { }

    @Get()
    findAll() {
        return this.discountService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.discountService.findOne(+id);
    }
}
