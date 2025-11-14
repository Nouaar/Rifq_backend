import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEmailDto {
  @ApiProperty({
    description: 'New email address',
    example: 'newemail@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @ApiProperty({
    description: 'Current password for verification',
    example: 'myPassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
