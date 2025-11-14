import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyNewEmailDto {
  @ApiProperty({
    description: 'New email address to verify',
    example: 'newemail@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @ApiProperty({
    description: 'Verification code sent to new email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
