import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AreaService } from './area.service';
import { CreateAreaDto } from './dto/create-area.dto';

@Controller('area')
export class AreaController {
    constructor(private readonly areaService: AreaService) { }

    @Post()
    create(@Body() createAreaDto: CreateAreaDto) {
        return this.areaService.create(createAreaDto);
    }

    @Get()
    findAll() {
        return this.areaService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.areaService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.areaService.remove(id);
    }
}
