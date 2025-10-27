import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer setup
const storage = multer.memoryStorage(); // store files in memory before sending to Supabase
const upload = multer({ storage });

// Route: handle formdata (fields + files)
app.post('/api/patients', upload.array('files'), async (req, res) => {
  try {
    // Text fields
    const { name, species, breed, owner_name, owner_phone } = req.body;

    if (!name || !species || !breed || !owner_name || !owner_phone) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Insert patient record
    const { data: patientData, error: insertError } = await supabase
      .from('patients')
      .insert([{ name, species, breed, owner_name, owner_phone }])
      .select()
      .single();

    if (insertError) return res.status(400).json({ error: insertError.message });

    // Handle files
   // inside your /api/patients route
const uploadedFiles = [];

if (req.files && req.files.length > 0) {
  for (const file of req.files) {
    const { originalname, buffer, mimetype } = file;

    // make filename unique
    const fileName = `${Date.now()}-${originalname}`;

    const { data: fileData, error: fileError } = await supabase.storage
      .from("patient-files")
      .upload(`patients/${patientData.id}/${fileName}`, buffer, {
        contentType: mimetype
      });

    if (fileError) {
      console.error("File upload error:", fileError);
      return res.status(400).json({ error: fileError.message });
    }

    // store path in 'files' table
    await supabase.from("files").insert([
      { patient_id: patientData.id, file_path: fileData.path }
    ]);

    uploadedFiles.push(fileData.path);
  }
}

    if (!req.files || req.files.length === 0) {
  console.log("No files received");
}


    res.json({
      message: 'Patient added successfully',
      patient: patientData,
      files: uploadedFiles
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
