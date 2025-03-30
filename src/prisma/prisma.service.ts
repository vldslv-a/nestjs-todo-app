import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
  public async onModuleDestroy() {
    await this.$disconnect();
  }

  public async onModuleInit() {
    await this.$connect();
  }
}
