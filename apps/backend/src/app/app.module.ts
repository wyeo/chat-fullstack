import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import type { Connection } from 'mongoose';

import { AppService } from '@backend/app/app.service';
import { AppController } from '@backend/app/app.controller';

import { AuthModule } from '@backend/auth/auth.module';
import { UsersModule } from '@backend/users/users.module';
import { MessagesModule } from '@backend/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        autoLoadEntities: true,
        host: configService.get('POSTGRES_HOST', 'localhost'),
        port: configService.get('POSTGRES_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'admin'),
        password: configService.get('POSTGRES_PASSWORD', 'password'),
        database: configService.get('POSTGRES_DB', 'chat_users'),
        synchronize:
          configService.get('NODE_ENV', 'development') === 'development',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('MONGODB_HOST', 'localhost');
        const port = configService.get('MONGODB_PORT', 27017);
        const database = configService.get('MONGODB_DB', 'chat_messages');
        const user = configService.get('MONGODB_USER');
        const password = configService.get('MONGODB_PASSWORD');

        let uri = `mongodb://`;

        if (user && password) {
          uri += `${user}:${password}@`;
        }

        uri += `${host}:${port}/${database}`;

        if (user && password) {
          uri += '?authSource=admin';
        }

        return {
          uri,
          connectionFactory: (connection: Connection) => connection,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
