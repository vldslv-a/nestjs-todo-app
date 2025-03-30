import * as fs from 'fs';
import * as path from 'path';

import { BadRequestException } from '@nestjs/common';
import { ErrorMessages } from 'src/common/constants/error-messages';

import type { Request } from 'express';

export const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void => {
  if (!RegExp(/\.(jpg|jpeg|png|gif|webp|svg)$/i).exec(file.originalname)) {
    return callback(new BadRequestException(ErrorMessages.INVALID_FILE_FORMAT), false);
  }

  callback(null, true);
};

export const removeFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const createUploadsFolder = (folderPath: string): void => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

export const getFileUrl = (filename: string, req: Request): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

export const getUserLogoPath = (filename: string): string => path.join(process.cwd(), 'uploads', filename);
