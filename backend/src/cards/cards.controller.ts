import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('cards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('boards/:boardId/cards')
  @ApiOperation({ summary: 'Create a card on a specific board' })
  create(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: CreateCardDto,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.create(boardId, dto, user.id);
  }

  @Get('boards/:boardId/cards')
  @ApiOperation({ summary: 'List all cards for a board (grouped by status on the client)' })
  findByBoard(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.cardsService.findByBoard(boardId);
  }

  @Get('cards/:id')
  @ApiOperation({ summary: 'Get a card with full details, history and attachments' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.findOne(id);
  }

  @Patch('cards/:id')
  @ApiOperation({ summary: 'Update a card — status, assignee, title, priority, due date' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardDto,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.update(id, dto, user.id);
  }

  @Delete('cards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a card' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.cardsService.remove(id, user.id);
  }
}
