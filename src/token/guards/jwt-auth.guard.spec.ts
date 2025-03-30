import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

import { JwtAuthGuard } from './jwt-auth.guard';

import type { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const MOCKED_SUPER_RESULT = 'mocked super.canActivate result';

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = moduleRef.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;

    beforeEach(() => {
      context = {
        getClass: jest.fn(),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('should return true when route is public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should call super.canActivate when route is not public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const canActivateSpy = jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation(function (
        this: JwtAuthGuard,
      ) {
        return reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
      });

      canActivateSpy.mockRestore();

      const parentPrototype = Object.getPrototypeOf(Object.getPrototypeOf(guard));
      const superCanActivateSpy = jest.spyOn(parentPrototype, 'canActivate').mockReturnValue(MOCKED_SUPER_RESULT);

      const result = guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(superCanActivateSpy).toHaveBeenCalledWith(context);
      expect(result).toBe(MOCKED_SUPER_RESULT);
    });
  });
});
