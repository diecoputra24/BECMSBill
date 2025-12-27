import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Patch } from '@nestjs/common';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';

@Controller('package')
export class PackageController {
    constructor(private readonly packageService: PackageService) { }

    @Post()
    create(@Body() createPackageDto: CreatePackageDto) {
        return this.packageService.create(createPackageDto);
    }

    @Get()
    findAll() {
        return this.packageService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.packageService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateData: Partial<CreatePackageDto>) {
        return this.packageService.update(id, updateData);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.packageService.remove(id);
    }
}
