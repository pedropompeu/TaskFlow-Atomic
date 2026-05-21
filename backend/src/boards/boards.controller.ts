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
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('boards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  create(@Body() dto: CreateBoardDto, @CurrentUser() user: User) {
    return this.boardsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all boards owned by the current user' })
  findAll(@CurrentUser() user: User) {
    return this.boardsService.findAllByOwner(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a board with its cards' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.boardsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update board title or description' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBoardDto,
    @CurrentUser() user: User,
  ) {
    return this.boardsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a board and all its cards' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.boardsService.remove(id, user.id);
  }
}
