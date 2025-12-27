import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { RouterService } from './router.service';
import { CreateRouterDto } from './dto/create-router.dto';

@Controller('router')
export class RouterController {
    constructor(private readonly routerService: RouterService) { }

    @Post()
    create(@Body() createRouterDto: CreateRouterDto) {
        return this.routerService.create(createRouterDto);
    }

    @Get()
    findAll() {
        return this.routerService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.routerService.findOne(id);
    }

    @Get('uuid/:uuid')
    findByUuid(@Param('uuid') uuid: string) {
        return this.routerService.findByUuid(uuid);
    }

    @Delete(':uuid')
    remove(@Param('uuid') uuid: string) {
        return this.routerService.remove(uuid);
    }

    @Get(':id/test')
    testConnection(@Param('id', ParseIntPipe) id: number) {
        return this.routerService.testConnection(id);
    }

    @Get('test/:uuid')
    testConnectionByUuid(@Param('uuid') uuid: string) {
        return this.routerService.testConnectionByUuid(uuid);
    }

    @Get(':id/resource')
    getResource(@Param('id', ParseIntPipe) id: number) {
        return this.routerService.getResource(id);
    }

    @Get('resource/:uuid')
    getResourceByUuid(@Param('uuid') uuid: string) {
        return this.routerService.getResourceByUuid(uuid);
    }

    @Get(':id/profiles')
    getPppProfiles(@Param('id', ParseIntPipe) id: number) {
        return this.routerService.getPppProfiles(id);
    }

    @Get('profiles/:uuid')
    getPppProfilesByUuid(@Param('uuid') uuid: string) {
        return this.routerService.getPppProfilesByUuid(uuid);
    }
}
