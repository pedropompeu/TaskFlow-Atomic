import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBoardDto {
  @ApiPropertyOptional({ example: 'Sprint 2026-Q2' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Q2 engineering tasks' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['color', 'gradient', 'image'], nullable: true })
  @IsOptional()
  @IsIn(['color', 'gradient', 'image', null])
  coverType?: string | null;

  @ApiPropertyOptional({ example: '#F78E2F', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverValue?: string | null;
}
