import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { AuthGuard, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../auth/user.decorator';

@Controller('transaction')
@UseGuards(AuthGuard, RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post()
  @Roles('FINANCE', 'ADMIN')
  create(@Body() createTransactionDto: CreateTransactionDto, @Session() session: UserSession) {
    if (session?.user?.id) {
      createTransactionDto.adminId = session.user.id;
    }
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  @Roles('TEKNISI', 'FINANCE', 'ADMIN')
  findAll(@User() user: any) {
    return this.transactionService.findAll(user);
  }

  @Get(':id')
  @Roles('TEKNISI', 'FINANCE', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(+id);
  }

  @Patch(':id')
  @Roles('FINANCE', 'ADMIN')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.transactionService.remove(+id);
  }

  @Post('bulk-delete')
  @Roles('ADMIN')
  removeMany(@Body('ids') ids: number[]) {
    return this.transactionService.removeMany(ids);
  }
}
