import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { FilesModule } from './files.module';

import type { TestingModule } from '@nestjs/testing';

describe('FilesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FilesModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(1024 * 1024),
          },
        },
      ],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
    expect(module.get(MulterModule)).toBeDefined();
  });
});
