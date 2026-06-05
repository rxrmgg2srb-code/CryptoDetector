/**
 * 🎨 NFT Metadata Upload API
 * 
 * Uploads NFT metadata to R2 for permanent storage
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '@/lib/logger';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || '',
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { metadata, key } = req.body;

        if (!metadata || !key) {
            return res.status(400).json({ error: 'Missing metadata or key' });
        }

        const bucket = process.env.R2_BUCKET_NAME || 'degenscore';

        // Upload to R2
        await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(metadata, null, 2),
            ContentType: 'application/json',
        }));

        // Construct public URL
        const publicUrl = `${process.env.R2_PUBLIC_URL || ''}/${key}`;

        logger.info('NFT metadata uploaded', { key, publicUrl });

        return res.status(200).json({
            success: true,
            url: publicUrl,
            key,
        });
    } catch (error) {
        logger.error('Failed to upload NFT metadata', error instanceof Error ? error : undefined);
        return res.status(500).json({ error: 'Failed to upload metadata' });
    }
}
