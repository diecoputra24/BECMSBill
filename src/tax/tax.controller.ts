import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Controller('tax')
export class TaxController {
    constructor(private readonly taxService: TaxService) { }

    @Post()
    create(@Body() createTaxDto: CreateTaxDto) {
        return this.taxService.create(createTaxDto);
    }

    @Get()
    findAll() {
        return this.taxService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.taxService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateTaxDto: UpdateTaxDto) {
        return this.taxService.update(id, updateTaxDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.taxService.remove(id);
    }
}
