import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Patch, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { User } from '../auth/user.decorator';

import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('branch')
@UseGuards(AuthGuard, RolesGuard)
export class BranchController {
    constructor(private readonly branchService: BranchService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() createBranchDto: CreateBranchDto) {
        return this.branchService.create(createBranchDto);
    }

    @Get()
    @Roles('TEKNISI', 'FINANCE', 'ADMIN')
    findAll(@User() user: any) {
        return this.branchService.findAll(user);
    }

    @Get(':id')
    @Roles('TEKNISI', 'FINANCE', 'ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.branchService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateBranchDto: UpdateBranchDto) {
        return this.branchService.update(id, updateBranchDto);
    }

    @Put(':id')
    @Roles('ADMIN')
    updatePut(@Param('id', ParseIntPipe) id: number, @Body() updateBranchDto: UpdateBranchDto) {
        return this.branchService.update(id, updateBranchDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.branchService.remove(id);
    }
}
