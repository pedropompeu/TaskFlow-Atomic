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
import { ReorderCardsDto } from './dto/reorder-cards.dto';
import { AddTagDto } from './dto/add-tag.dto';
import { AddAssigneeDto } from './dto/add-assignee.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('cards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  // ── Card CRUD ─────────────────────────────────────────────────────────────

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
  @ApiOperation({ summary: 'List all cards for a board' })
  findByBoard(@Param('boardId', ParseUUIDPipe) boardId: string) {
    return this.cardsService.findByBoard(boardId);
  }

  @Get('cards/:id')
  @ApiOperation({ summary: 'Get a card with full details, history and attachments' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.findOne(id);
  }

  @Patch('boards/:boardId/cards/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk-update card positions within a board' })
  reorder(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @Body() dto: ReorderCardsDto,
  ) {
    return this.cardsService.reorder(boardId, dto.orderedIds);
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

  // ── Tags ──────────────────────────────────────────────────────────────────

  @Post('cards/:id/tags')
  @ApiOperation({ summary: 'Add a tag to a card' })
  addTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTagDto,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.addTag(id, dto, user.id);
  }

  @Delete('cards/:id/tags/:tagId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a tag from a card' })
  removeTag(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.cardsService.removeTag(tagId);
  }

  // ── Assignees ──────────────────────────────────────────────────────────────

  @Post('cards/:id/assignees')
  @ApiOperation({ summary: 'Add an assignee to a card' })
  addAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddAssigneeDto,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.addAssignee(id, dto.userId, user.id);
  }

  @Delete('cards/:id/assignees/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an assignee from a card' })
  removeAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.removeAssignee(id, userId, user.id);
  }

  // ── Trash ─────────────────────────────────────────────────────────────────

  @Get('boards/:boardId/trash')
  @ApiOperation({ summary: 'List soft-deleted cards for a board' })
  findTrashed(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.findTrashed(boardId, user.id);
  }

  @Post('cards/:id/restore')
  @ApiOperation({ summary: 'Restore a card from trash' })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.restore(id, user.id);
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  @Post('cards/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a card' })
  createComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.createComment(id, dto, user.id);
  }

  @Delete('cards/:id/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment (own comment or board owner)' })
  deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.deleteComment(commentId, user.id);
  }
}
