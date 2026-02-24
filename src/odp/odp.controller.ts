import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Patch, Put, UseGuards } from '@nestjs/common';
import { OdpService } from './odp.service';
import { CreateOdpDto } from './dto/create-odp.dto';
import { UpdateOdpDto } from './dto/update-odp.dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from '../auth/roles.guard';
import { User } from '../auth/user.decorator';

@Controller('odp')
@UseGuards(AuthGuard, RolesGuard)
export class OdpController {
    constructor(private readonly odpService: OdpService) { }

    @Post()
    create(@Body() createOdpDto: CreateOdpDto) {
        return this.odpService.create(createOdpDto);
    }

    @Get()
    findAll(@User() user: any) {
        return this.odpService.findAll(user);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.odpService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateOdpDto: UpdateOdpDto) {
        return this.odpService.update(id, updateOdpDto);
    }

    @Put(':id')
    updatePut(@Param('id', ParseIntPipe) id: number, @Body() updateOdpDto: UpdateOdpDto) {
        return this.odpService.update(id, updateOdpDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.odpService.remove(id);
    }
}
