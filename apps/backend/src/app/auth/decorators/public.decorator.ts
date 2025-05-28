import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '@backend/auth/constants/auth.constants';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
