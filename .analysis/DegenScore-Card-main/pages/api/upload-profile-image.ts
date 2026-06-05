import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { isValidSolanaAddress, isValidImageType } from '../../lib/validation';
import { rateLimit } from '../../lib/rateLimit';
import { logger } from '../../lib/logger';
import { UPLOAD_CONFIG } from '../../lib/config';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply strict rate limiting for uploads
  // 5 uploads per hour (3600000 ms)
  if (!(await rateLimit(req, res, { windowMs: 3600000, maxRequests: 5 }))) {
    return;
  }

  try {
    // Parse form data
    const form = new IncomingForm({
      maxFileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        }
        resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const walletAddress = Array.isArray(fields.walletAddress)
      ? fields.walletAddress[0]
      : fields.walletAddress;

    // Validate wallet address
    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type by MIME
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype || '')) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Validate file type by magic numbers (prevents spoofing)
    const fileBuffer = fs.readFileSync(file.filepath);
    if (!isValidImageType(fileBuffer, file.mimetype || '')) {
      fs.unlinkSync(file.filepath); // Clean up
      return res.status(400).json({ error: 'File content does not match declared type' });
    }

    // Additional file size check (server-side)
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: 'File too large' });
    }

    // ✅ R2 DESHABILITADO - Guardar imagen como base64 data URI
    // Esto permite almacenar la imagen directamente en la base de datos de forma segura
    const base64Image = fileBuffer.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    // Delete temporary file
    fs.unlinkSync(file.filepath);

    logger.info('✅ Image converted to base64 for wallet', {
      walletAddress,
      size: fileBuffer.length,
      mimeType,
    });

    res.status(200).json({
      success: true,
      imageUrl: dataUri,
    });
  } catch (error: any) {
    logger.error('Error uploading image', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    const errorMessage =
      process.env.NODE_ENV === 'development' ? error.message : 'Failed to upload image';

    res.status(500).json({ error: errorMessage });
  }
}
