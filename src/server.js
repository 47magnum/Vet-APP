import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';
import cors from 'cors'

dotenv.config();
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Multer setup
const storage = multer.memoryStorage();
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

// Route: Get all patients with files
// Route: Search patients with filters
app.get('/api/patients/search', async (req, res) => {
  try {
    const { name, id, owner_name, owner_phone } = req.query;

    // Start with base query
    let query = supabase.from('patients').select('*');

    // Add filters dynamically (AND logic - all provided filters must match)
    if (name && name.trim()) {
      query = query.ilike('name', `%${name.trim()}%`);
    }
    if (id && id.trim()) {
      query = query.eq('id', id.trim());
    }
    if (owner_name && owner_name.trim()) {
      query = query.ilike('owner_name', `%${owner_name.trim()}%`);
    }
    if (owner_phone && owner_phone.trim()) {
      query = query.ilike('owner_phone', `%${owner_phone.trim()}%`);
    }

    // Execute query
    const { data: patients, error: patientsError } = await query;

    if (patientsError) {
      return res.status(500).json({ error: patientsError.message });
    }

    // Fetch files for each patient (same logic as main GET route)
    const patientsWithFiles = await Promise.all(
      patients.map(async (patient) => {
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('file_path')
          .eq('patient_id', patient.id);

        if (filesError) {
          console.error('Error fetching files:', filesError);
          patient.files = [];
          return patient;
        }

        if (files && files.length > 0) {
          patient.files = files.map(file => {
            const { data } = supabase.storage
              .from('patient-files')
              .getPublicUrl(file.file_path);
            
            return data.publicUrl;
          });
        } else {
          patient.files = [];
        }

        return patient;
      })
    );

    res.json(patientsWithFiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});




app.get('/api/patients', async (req, res) => {
  try {
    // Get all patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*');

    if (patientsError) {
      return res.status(500).json({ error: patientsError.message });
    }

    // For each patient, fetch their files
    const patientsWithFiles = await Promise.all(
      patients.map(async (patient) => {
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('file_path')
          .eq('patient_id', patient.id);

        if (filesError) {
          console.error('Error fetching files:', filesError);
          patient.files = [];
          return patient;
        }

        // Transform file paths to public URLs
        if (files && files.length > 0) {
          patient.files = files.map(file => {
            const { data } = supabase.storage
              .from('patient-files')  // ✅ Correct bucket name
              .getPublicUrl(file.file_path);
            
            return data.publicUrl;
          });
        } else {
          patient.files = [];
        }

        return patient;
      })
    );

    res.json(patientsWithFiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));