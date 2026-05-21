import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardPriority, CardStatus } from '../entities/card.entity';

export class CreateCardDto {
  @ApiProperty({ example: 'Implement login page' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Build the login form with validation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: CardStatus, default: CardStatus.TODO })
  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;

  @ApiPropertyOptional({ enum: CardPriority, default: CardPriority.MEDIUM })
  @IsOptional()
  @IsEnum(CardPriority)
  priority?: CardPriority;

  @ApiPropertyOptional({ description: 'UUID of the user to assign' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
