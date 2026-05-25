import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
