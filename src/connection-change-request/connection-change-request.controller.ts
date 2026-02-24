import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ConnectionChangeRequestService } from './connection-change-request.service';
import { CreateConnectionChangeRequestDto, ApproveConnectionChangeRequestDto } from './dto/connection-change-request.dto';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { User } from '../auth/user.decorator';

@Controller('connection-change-request')
@UseGuards(AuthGuard)
export class ConnectionChangeRequestController {
    constructor(private readonly service: ConnectionChangeRequestService) { }

    @Get()
    findAll(@User() user: any) {
        return this.service.findAll(user);
    }

    @Get('pending')
    findPending(@User() user: any) {
        return this.service.findPending(user);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(+id);
    }

    @Post()
    create(@Body() dto: CreateConnectionChangeRequestDto, @User() user: any) {
        return this.service.create({
            ...dto,
            requestedBy: user.username
        });
    }

    @Patch(':id/approve')
    approve(@Param('id') id: string, @Body() dto: ApproveConnectionChangeRequestDto, @User() user: any) {
        return this.service.approve(+id, {
            ...dto,
            approvedBy: user.username
        });
    }

    @Patch(':id/reject')
    reject(@Param('id') id: string, @Body() dto: ApproveConnectionChangeRequestDto, @User() user: any) {
        return this.service.reject(+id, {
            ...dto,
            approvedBy: user.username
        });
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.delete(+id);
    }
}
