import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTagDto {
  @ApiProperty({ example: 'frontend' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '#6B7280', description: 'Hex color code' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex like #6B7280' })
  color?: string;
}
