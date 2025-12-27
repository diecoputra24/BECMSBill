import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { OdpService } from './odp.service';
import { CreateOdpDto } from './dto/create-odp.dto';

@Controller('odp')
export class OdpController {
    constructor(private readonly odpService: OdpService) { }

    @Post()
    create(@Body() createOdpDto: CreateOdpDto) {
        return this.odpService.create(createOdpDto);
    }

    @Get()
    findAll() {
        return this.odpService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.odpService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.odpService.remove(id);
    }
}
