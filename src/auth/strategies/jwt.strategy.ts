import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from 'src/token/dto/jwt-payload.dto';
import { JwtUserPayload } from 'src/token/models/jwt-user-payload.model';
import { JwtService } from 'src/token/services/jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  public constructor(
    configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  public async validate(payload: JwtPayloadDto): Promise<JwtUserPayload> {
    return this.jwtService.validatePayload(payload);
  }
}
