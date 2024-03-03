import path from 'path';
import parseFileName from './parseFileName';

export default (file: Express.Multer.File) => {
    const { base, ext } = parseFileName(file.originalname);

    const fullFilePath = path.join('upload', base, `full${ext}`);
    const compressedFilePath = path.join('upload', base, `min${ext}`);

    return {fullFilePath, compressedFilePath, ext}
}