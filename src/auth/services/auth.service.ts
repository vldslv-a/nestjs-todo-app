import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { TokenResponse } from 'src/token/models/token-response.model';
import { JwtService } from 'src/token/services/jwt.service';
import { UsersService } from 'src/users/services/users.service';
import { VerificationService } from 'src/verification/services/verification.service';

import { LoginDto } from '../dto/login.dto';
import { RegistrationDto } from '../dto/registration.dto';

@Injectable()
export class AuthService {
  public constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly verificationService: VerificationService,
  ) {}

  public async login({ email, password, rememberMe = false }: LoginDto): Promise<TokenResponse> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    return this.jwtService.generateAuthTokens({ email, id: user.id }, rememberMe);
  }

  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    return this.jwtService.refreshToken(refreshToken);
  }

  public async registration({ email, password, ...userPayload }: RegistrationDto): Promise<null> {
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new UnauthorizedException(ErrorMessages.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await hash(password, 10);

    await this.usersService.create({ ...userPayload, email, password: hashedPassword });

    await this.verificationService.sendVerificationEmail({ email });

    return null;
  }
}
