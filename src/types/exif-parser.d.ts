declare module "exif-parser" {
  interface ExifTags {
    DateTimeOriginal?: number;
    CreateDate?: number;
    Model?: string;
    Make?: string;
    ISO?: number;
    FNumber?: number;
    ExposureTime?: number;
    FocalLength?: number;
    ImageWidth?: number;
    ImageHeight?: number;
    [key: string]: string | number | undefined;
  }

  interface ExifData {
    tags: ExifTags;
    imageSize?: {
      width: number;
      height: number;
    };
    thumbnailOffset?: number;
    thumbnailLength?: number;
    thumbnailType?: number;
    app1Offset?: number;
  }

  interface ExifParser {
    parse(): ExifData;
  }

  interface ExifParserFactory {
    create(buffer: Buffer): ExifParser;
  }

  const ExifParser: ExifParserFactory;
  export = ExifParser;
}
