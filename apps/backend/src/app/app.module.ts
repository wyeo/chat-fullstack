import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppService } from '@backend/app/app.service';
import { AppController } from '@backend/app/app.controller';

import { AuthModule } from '@backend/auth/auth.module';
import { UsersModule } from '@backend/users/users.module';

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
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
