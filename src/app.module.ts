import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BranchModule } from './branch/branch.module';
import { AreaModule } from './area/area.module';
import { OdpModule } from './odp/odp.module';
import { RouterModule } from './router/router.module';
import { PackageModule } from './package/package.module';
import { CustomerModule } from './customer/customer.module';
import { ConnectionModule } from './connection/connection.module';

@Module({
  imports: [PrismaModule, BranchModule, AreaModule, OdpModule, RouterModule, PackageModule, CustomerModule, ConnectionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
