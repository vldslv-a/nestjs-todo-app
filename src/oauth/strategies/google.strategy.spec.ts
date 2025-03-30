import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { GoogleStrategy } from './google.strategy';

import type { OAuthProfile } from '../models/oauth-profile.model';
import type { TestingModule } from '@nestjs/testing';

const MOCK_EMAIL = 'test@example.com';

describe('GoogleStrategy', () => {
  let googleStrategy: GoogleStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => `mock-${key}`),
          },
        },
      ],
    }).compile();

    googleStrategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(googleStrategy).toBeDefined();
  });

  it('should validate and return user object', async () => {
    const mockProfile: OAuthProfile = {
      emails: [{ value: MOCK_EMAIL }],
      id: '12345',
      name: { familyName: 'Doe', givenName: 'John' },
      photos: [{ value: 'http://example.com/photo.jpg' }],
      provider: 'google',
    };

    const done = jest.fn();
    await googleStrategy.validate('', '', mockProfile, done);

    expect(done).toHaveBeenCalledWith(null, {
      email: MOCK_EMAIL,
      firstName: 'John',
      lastName: 'Doe',
      profileId: '12345',
      profileImage: 'http://example.com/photo.jpg',
      provider: 'google',
    });
  });

  it('should handle profile with missing data', async () => {
    const mockIncompleteProfile: OAuthProfile = {
      emails: undefined,
      id: '12345',
      name: { familyName: undefined, givenName: undefined },
      photos: undefined,
      provider: 'google',
    };

    const done = jest.fn();
    await googleStrategy.validate('', '', mockIncompleteProfile, done);

    expect(done).toHaveBeenCalledWith(null, {
      email: '',
      firstName: '',
      lastName: '',
      profileId: '12345',
      profileImage: undefined,
      provider: 'google',
    });
  });
});
