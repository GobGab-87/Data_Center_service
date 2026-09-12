import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Initialize Supabase Client if env vars are present
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'defect-photos';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Ensure upload directory exists for local fallback
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage to handle file buffer for either Supabase or Local
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('อนุญาตให้อัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น'));
    }
  },
});

export const handlePhotoUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'ไม่พบไฟล์รูปภาพที่อัปโหลด' });
      return;
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `defect-${uniqueSuffix}${ext}`;

    // 1. If Supabase is configured, upload to Supabase Storage Bucket
    if (supabase) {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Supabase Storage upload error:', error);
        throw new Error(`ไม่สามารถอัปโหลดไปยัง Supabase Storage ได้: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(supabaseBucket)
        .getPublicUrl(data.path);

      res.status(201).json({
        message: 'อัปโหลดรูปภาพไปยัง Supabase Storage สำเร็จ',
        photoUrl: publicUrlData.publicUrl,
        filename,
        size: req.file.size,
      });
      return;
    }

    // 2. Fallback: Save to local disk
    const localFilePath = path.join(uploadDir, filename);
    fs.writeFileSync(localFilePath, req.file.buffer);

    const fileUrl = `/uploads/${filename}`;
    res.status(201).json({
      message: 'อัปโหลดรูปภาพสำเร็จ (Local Storage)',
      photoUrl: fileUrl,
      filename,
      size: req.file.size,
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({ message: err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
  }
};
