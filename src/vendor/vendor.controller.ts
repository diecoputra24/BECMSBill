import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('vendor')
@UseGuards(AuthGuard, RolesGuard)
export class VendorController {
    constructor(private readonly vendorService: VendorService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() createVendorDto: CreateVendorDto) {
        return this.vendorService.create(createVendorDto);
    }

    @Get()
    @Roles('TEKNISI', 'FINANCE', 'ADMIN')
    findAll() {
        return this.vendorService.findAll();
    }

    @Get(':id')
    @Roles('TEKNISI', 'FINANCE', 'ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.vendorService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateVendorDto: UpdateVendorDto) {
        return this.vendorService.update(id, updateVendorDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.vendorService.remove(id);
    }
}
