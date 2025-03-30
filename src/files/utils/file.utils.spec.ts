import * as fs from 'fs';
import * as path from 'path';

import { BadRequestException } from '@nestjs/common';

import { createUploadsFolder, getFileUrl, getUserLogoPath, imageFileFilter, removeFile } from './file.utils';

import type { Request } from 'express';

jest.mock('fs');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('file.utils', () => {
  describe('imageFileFilter', () => {
    it('should accept valid image files', () => {
      const callback = jest.fn();
      const file = { originalname: 'image.jpg' } as Express.Multer.File;

      imageFileFilter({} as Request, file, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should reject invalid image files', () => {
      const callback = jest.fn();
      const file = { originalname: 'document.pdf' } as Express.Multer.File;

      imageFileFilter({} as Request, file, callback);

      expect(callback).toHaveBeenCalledWith(expect.any(BadRequestException), false);
    });
  });

  describe('removeFile', () => {
    it('should remove the file if it exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlink as unknown as jest.Mock).mockImplementation((_, callback) => callback(null));

      await expect(removeFile('test.txt')).resolves.toBeUndefined();
      expect(fs.unlink).toHaveBeenCalledWith('test.txt', expect.any(Function));
    });

    it('should resolve if the file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(removeFile('test.txt')).resolves.toBeUndefined();
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it('should reject if an error occurs', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlink as unknown as jest.Mock).mockImplementation((_, callback) => callback(new Error('unlink error')));

      await expect(removeFile('test.txt')).rejects.toThrow('unlink error');
    });

    it('should reject if fs.existsSync throws an error', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(() => {
        throw new Error('existsSync error');
      });

      await expect(removeFile('test.txt')).rejects.toThrow('existsSync error');
    });
  });

  describe('createUploadsFolder', () => {
    it('should create the folder if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation();

      createUploadsFolder('uploads');

      expect(fs.mkdirSync).toHaveBeenCalledWith('uploads', { recursive: true });
    });

    it('should not create the folder if it exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      createUploadsFolder('uploads');

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getFileUrl', () => {
    it('should return the correct file URL', () => {
      const req = {
        get: jest.fn().mockReturnValue('localhost:3000'),
        protocol: 'http',
      } as unknown as Request;

      const result = getFileUrl('test.jpg', req);

      expect(result).toBe('http://localhost:3000/uploads/test.jpg');
    });
  });

  describe('getUserLogoPath', () => {
    it('should return the correct file path', () => {
      const result = getUserLogoPath('test.jpg');

      expect(result).toBe(path.join(process.cwd(), 'uploads', 'test.jpg'));
    });
  });
});
