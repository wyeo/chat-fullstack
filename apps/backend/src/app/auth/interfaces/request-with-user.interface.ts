import { Request } from 'express';

import { UserEntity } from '@backend/users/user.entity';

export interface RequestWithUser extends Request {
  user: UserEntity;
}
