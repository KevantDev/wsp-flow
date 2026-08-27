import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Public } from '../../core/decorators/public.decorator';

const uploadDir = join(process.cwd(), 'uploads', 'products');

@Controller('upload')
export class UploadController {
  @Public()
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(new BadRequestException('Solo se permiten archivos de imagen (JPG, PNG, WEBP, GIF)'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/products/${file.filename}`;

    return {
      url: fileUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
