import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('attachments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('cards/:id/attachments')
export class AttachmentsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an attachment to a card' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DEST || './uploads',
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
    }),
  )
  upload(
    @Param('id', ParseUUIDPipe) cardId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.addAttachment(cardId, file, user.id);
  }

  @Delete(':attachmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an attachment' })
  remove(
    @Param('id', ParseUUIDPipe) _cardId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentUser() user: User,
  ) {
    return this.cardsService.removeAttachment(attachmentId, user.id);
  }
}
