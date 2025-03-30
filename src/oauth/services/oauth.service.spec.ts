import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/token/services/jwt.service';
import { UsersService } from 'src/users/services/users.service';

import { OAuthService } from './oauth.service';

import type { OAuthUser } from '../models/oauth-user.model';
import type { TestingModule } from '@nestjs/testing';

const MOCK_EMAIL = 'test@example.com';

describe('OAuthService', () => {
  let oauthService: OAuthService;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    generateAuthTokens: jest.fn(),
  };

  const mockPrismaService = {
    oAuthProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    oauthService = module.get<OAuthService>(OAuthService);
  });

  it('should be defined', () => {
    expect(oauthService).toBeDefined();
  });

  it('should handle OAuth login for existing profile', async () => {
    const mockProfile = { user: { email: MOCK_EMAIL, id: 1 } };
    mockPrismaService.oAuthProfile.findUnique.mockResolvedValue(mockProfile);
    mockJwtService.generateAuthTokens.mockResolvedValue({ accessToken: 'token', refreshToken: 'refresh' });

    const result = await oauthService.handleOAuthLogin({ profileId: '123', provider: 'google' } as OAuthUser);

    expect(result).toEqual({ accessToken: 'token', refreshToken: 'refresh', user: mockProfile.user });
  });

  it('should create a new user and profile if not found', async () => {
    mockPrismaService.oAuthProfile.findUnique.mockResolvedValue(null);
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.create.mockResolvedValue({ email: MOCK_EMAIL, id: 1 });
    mockJwtService.generateAuthTokens.mockResolvedValue({ accessToken: 'token', refreshToken: 'refresh' });

    const result = await oauthService.handleOAuthLogin({
      email: MOCK_EMAIL,
      profileId: '123',
      provider: 'google',
    } as OAuthUser);

    expect(result).toEqual({ accessToken: 'token', refreshToken: 'refresh', user: { email: MOCK_EMAIL, id: 1 } });
  });
});
