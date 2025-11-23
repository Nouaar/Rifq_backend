import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class UpdateBookingDto {
  @IsEnum(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
