import { IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  idToken: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  refreshToken: string;
}
