import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Put, Patch, UseGuards } from '@nestjs/common';
import { AreaService } from './area.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth'; // Or check import path
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../auth/user.decorator';

import { Roles } from '../auth/roles.decorator';

@Controller('area')
@UseGuards(AuthGuard, RolesGuard)
export class AreaController {
    constructor(private readonly areaService: AreaService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() createAreaDto: CreateAreaDto) {
        return this.areaService.create(createAreaDto);
    }

    @Get()
    @Roles('TEKNISI', 'FINANCE', 'ADMIN')
    findAll(@User() user: any) {
        return this.areaService.findAll(user);
    }

    @Get(':id')
    @Roles('TEKNISI', 'FINANCE', 'ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.areaService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    updatePatch(@Param('id', ParseIntPipe) id: number, @Body() updateAreaDto: UpdateAreaDto) {
        return this.areaService.update(id, updateAreaDto);
    }

    @Put(':id')
    @Roles('ADMIN')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateAreaDto: UpdateAreaDto) {
        return this.areaService.update(id, updateAreaDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.areaService.remove(id);
    }
}
