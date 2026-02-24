import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AddonService } from './addon.service';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';

@Controller('addon')
export class AddonController {
    constructor(private readonly addonService: AddonService) { }

    @Post()
    create(@Body() createAddonDto: CreateAddonDto) {
        return this.addonService.create(createAddonDto);
    }

    @Get()
    findAll() {
        return this.addonService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.addonService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateAddonDto: UpdateAddonDto) {
        return this.addonService.update(id, updateAddonDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.addonService.remove(id);
    }
}
