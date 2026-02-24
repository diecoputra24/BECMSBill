import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UpgradeRequestService } from './upgrade-request.service';
import { CreateUpgradeRequestDto, ApproveUpgradeRequestDto } from './dto/upgrade-request.dto';

@Controller('upgrade-request')
export class UpgradeRequestController {
    constructor(private readonly service: UpgradeRequestService) { }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get('pending')
    findPending() {
        return this.service.findPending();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateUpgradeRequestDto) {
        return this.service.create(dto);
    }

    @Patch(':id/approve')
    approve(@Param('id', ParseIntPipe) id: number, @Body() dto: ApproveUpgradeRequestDto) {
        return this.service.approve(id, dto);
    }

    @Patch(':id/reject')
    reject(@Param('id', ParseIntPipe) id: number, @Body() dto: ApproveUpgradeRequestDto) {
        return this.service.reject(id, dto);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.service.delete(id);
    }
}
