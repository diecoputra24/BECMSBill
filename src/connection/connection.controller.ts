import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Patch } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { CreateConnectionDto } from './dto/create-connection.dto';

@Controller('connection')
export class ConnectionController {
    constructor(private readonly connectionService: ConnectionService) { }

    @Post()
    create(@Body() createConnectionDto: CreateConnectionDto) {
        return this.connectionService.create(createConnectionDto);
    }

    @Get()
    findAll() {
        return this.connectionService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.connectionService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateData: Partial<CreateConnectionDto>) {
        return this.connectionService.update(id, updateData);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.connectionService.remove(id);
    }
}
