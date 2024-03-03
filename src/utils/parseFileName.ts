import path from 'path';

export default (fullName: string): {base: string, ext: string} => {
    return {
        base: path.basename(fullName, path.extname(fullName)),
        ext: path.extname(fullName)
    }
}