import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConnectionController } from './connection.controller';
import { RouterModule } from '../router/router.module';

@Module({
    imports: [RouterModule],
    controllers: [ConnectionController],
    providers: [ConnectionService],
    exports: [ConnectionService],
})
export class ConnectionModule { }

