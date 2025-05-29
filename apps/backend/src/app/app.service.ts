import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Returns basic application data with a welcome message
   * 
   * @returns {{message: string}} Object containing welcome message
   */
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
