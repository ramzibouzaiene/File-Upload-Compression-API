// Native Imports
import path from 'path';
import fs from 'fs'

// Swagger Imports
import swaggerjsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

// Third Party Imports
import express, {NextFunction, Request, Response} from 'express';
import multer from 'multer';
import parseFileName from './utils/parseFileName';
import { MediaType } from './types/MediaType';
import prepareFileDetails from './utils/prepareFileDetails';
import compressImage from './types/compressImage';

// Config
const app = express();
const port = process.env.PORT || 3000;

const multerStorage = multer.diskStorage({
    destination(_, file, callback){
        const {base} = parseFileName(file.originalname);

        fs.promises.mkdir(path.join('upload', base), {recursive: true})
            .then(() => {
                callback(null, `upload/${base}`);
            })
    },
    filename: (_, file, cb) => cb(null, `full${parseFileName(file.originalname).ext}`)
})

const upload = multer({storage: multerStorage});

// Swagger Config
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Upload file',
            description: 'Upload a file',
            contact: {
                name: 'ramzi bouzaiene'
            },
            version: "1.0.0"
        },
        servers: [
            {
                url: "http://localhost:3000/"
            }
        ],
    },
    apis: ["**/*.ts"]
}

const swaggerDocs = swaggerjsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// Middleware

const checkFileValidMW = (req: Request, res: Response, next: NextFunction) => {
    if(!req.file || !req.file.filename) {
        res.sendStatus(400);
        return ;
    }
    next();
}

// Routes
/**
 * @swagger
 * /v1/upload:
 *   post:
 *     summary: Upload file.
 *     description: Upload file.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         schema:
 *           type: file
 *         required: true
 *         description: File
 *     responses:
 *       '200':
 *         description: A successful response
 *       '404':
 *         description: file not found
 *       '500':
 *         description: Internal server error
 */
app.post('/v1/upload', upload.single('file'), checkFileValidMW, async (req: Request, res: Response) => {
    const { file } = req;
    console.log(file);
    res.send('file uploaded successfully');

    if(file){
        const { fullFilePath, compressedFilePath, ext } = prepareFileDetails(file);
        res.on('finish', async () => await compressImage(fullFilePath, compressedFilePath, 20, ext as MediaType))
    }
})

/**
 * @swagger
 * /{filename}:
 *   get:
 *     summary: Get uploaded file.
 *     description: get upload file with full size and min size.
 *     parameters:
 *       - in: path
 *         name: filename
 *         schema:
 *           type: string
 *           pattern: '^.*\.(png|jpg|webp|gif)$'
 *         required: true
 *         description: File name
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum:
 *             - min
 *             - full
 *         required: false
 *         description: Optional parameter for file size (select 'min' or 'full')
 *     responses:
 *       '200':
 *         description: A successful response
 *       '404':
 *         description: file not found
 *       '500':
 *         description: Internal server error
 */
app.get('/:filename', async (req: Request, res: Response) => {
    const { filename } = req.params;

    const { base, ext } = parseFileName(filename);
    const size = req.query.size == 'min' ? `min${ext}` : `full${ext}`;

    const parentDir = path.dirname(__dirname);
    const filePath = path.join(parentDir, 'upload', base, size);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if(err){
            res.status(400).send(`Unable to find ${filename}`);
            return;
        }
        res.sendFile(filePath);
    })
})

// Instantiation
app.listen(port, () => {
    console.log("server running in port : ", port);
})