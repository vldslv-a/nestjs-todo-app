import * as path from 'path';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

import { createUploadsFolder, imageFileFilter } from './utils/file.utils';

const UPLOAD_DIR = 'uploads';

createUploadsFolder(path.join(process.cwd(), UPLOAD_DIR));

@Module({
  exports: [MulterModule],
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        fileFilter: imageFileFilter,
        limits: {
          fileSize: configService.getOrThrow<number>('MAX_LOGO_SIZE'),
        },
        // eslint-disable-next-line sonarjs/content-length
        storage: diskStorage({
          destination: (_req, _file, callback) => {
            callback(null, UPLOAD_DIR);
          },
          filename: (_req, file, callback) => {
            const uniqueSuffix = uuidv4();
            const fileExtension = path.extname(file.originalname);

            callback(null, `${uniqueSuffix}${fileExtension}`);
          },
        }),
      }),
    }),
  ],
})
export class FilesModule {}
