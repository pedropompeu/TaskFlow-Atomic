import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderCardsDto {
  @ApiProperty({ type: [String], description: 'Card IDs in their new order' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
