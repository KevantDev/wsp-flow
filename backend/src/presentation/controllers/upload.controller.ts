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

const uploadDirProducts = join(process.cwd(), 'uploads', 'products');
const uploadDirVideos = join(process.cwd(), 'uploads', 'videos');

@Controller('upload')
export class UploadController {
  @Public()
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync(uploadDirProducts)) {
            mkdirSync(uploadDirProducts, { recursive: true });
          }
          cb(null, uploadDirProducts);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo para fotos
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/i)) {
          return cb(
            new BadRequestException(
              'Solo se permiten imágenes en formato JPG, PNG, WEBP o GIF',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo de imagen');
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

  @Public()
  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync(uploadDirVideos)) {
            mkdirSync(uploadDirVideos, { recursive: true });
          }
          cb(null, uploadDirVideos);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo estricto para videos
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|webm|quicktime|x-matroska|mov|avi)$/i)) {
          return cb(
            new BadRequestException(
              'Solo se permiten videos en formato MP4, WEBM o MOV (Máx. 10MB)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo de video');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('El video excede el límite máximo permitido de 10MB');
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/videos/${file.filename}`;

    return {
      url: fileUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
