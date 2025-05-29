import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const token = this.extractTokenFromClient(client);

    if (!token) {
      throw new WsException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.userEmail = payload.email;

      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }

  private extractTokenFromClient(client: AuthenticatedSocket): string | undefined {
    return (
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1] ||
      (client.handshake.query?.token as string)
    );
  }
}
