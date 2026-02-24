import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NetworkMapService } from './network-map.service';
import { CreateNetworkMapDto } from './dto/create-network-map.dto';
import { UpdateNetworkMapDto } from './dto/update-network-map.dto';

@Controller('network-maps')
export class NetworkMapController {
    constructor(private readonly networkMapService: NetworkMapService) { }

    @Post()
    create(@Body() createNetworkMapDto: CreateNetworkMapDto) {
        return this.networkMapService.create(createNetworkMapDto);
    }

    @Get()
    findAll() {
        return this.networkMapService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.networkMapService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateNetworkMapDto: UpdateNetworkMapDto) {
        return this.networkMapService.update(id, updateNetworkMapDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.networkMapService.remove(id);
    }
}
