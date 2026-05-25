import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
}
