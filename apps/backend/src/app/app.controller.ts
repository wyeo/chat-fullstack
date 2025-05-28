import { Controller, Get } from '@nestjs/common';

import { AppService } from '@backend/app/app.service';
import { Public } from '@backend/auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getData() {
    return this.appService.getData();
  }
}
