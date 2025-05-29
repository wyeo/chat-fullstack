import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  Message,
  MessageSchema,
} from '@backend/messages/schemas/message.schema';
import {
  OnlineUser,
  OnlineUserSchema,
} from '@backend/messages/schemas/online-user.schema';
import { UsersModule } from '@backend/app/users/users.module';
import { MessagesService } from '@backend/messages/messages.service';
import { MessagesGateway } from '@backend/messages/messages.gateway';
import { Room, RoomSchema } from '@backend/messages/schemas/room.schema';
import { MessagesController } from '@backend/messages/messages.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Room.name, schema: RoomSchema },
      { name: OnlineUser.name, schema: OnlineUserSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRATION', '24h') },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
