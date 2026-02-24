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
import { DiscountModule } from './discount/discount.module';
import { AddonModule } from './addon/addon.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TransactionModule } from './transaction/transaction.module';
import { NetworkMapModule } from './network-map/network-map.module';
import { TaxModule } from './tax/tax.module';
import { PromiseToPayModule } from './promise-to-pay/promise-to-pay.module';
import { UpgradeRequestModule } from './upgrade-request/upgrade-request.module';
import { CustomerChangeRequestModule } from './customer-change-request/customer-change-request.module';
import { CustomerStatusRequestModule } from './customer-status-request/customer-status-request.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth';
import { ScheduleModule } from '@nestjs/schedule';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { UsersModule } from './users/users.module';
import { VendorModule } from './vendor/vendor.module';
import { ConnectionChangeRequestModule } from './connection-change-request/connection-change-request.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule.forRoot({ auth, disableGlobalAuthGuard: true }),
    PrismaModule,
    BranchModule,
    AreaModule,
    OdpModule,
    RouterModule,
    PackageModule,
    CustomerModule,
    ConnectionModule,
    DiscountModule,
    AddonModule,
    InvoiceModule,
    TransactionModule,
    NetworkMapModule,
    TaxModule,
    PromiseToPayModule,
    UpgradeRequestModule,
    CustomerChangeRequestModule,
    CustomerStatusRequestModule,
    RoleModule,
    PermissionModule,
    UsersModule,
    VendorModule,
    ConnectionChangeRequestModule
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
