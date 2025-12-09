// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import cors from 'cors';

dotenv.config();

const app = express();

// Basic production config
app.disable('x-powered-by'); // small security improvement
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // if Render is fronting with a proxy
}

// CORS - allow only the frontend origin in production
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL];
app.use(cors({
  origin: '*', // allow all origins for now
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase client (service role key must be stored in Render env, not in frontend)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  // It's ok to not exit here during dev, but in prod you might want to fail fast
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Multer setup - memory storage (buffers). Limit file size to 10 MB each.
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || `${10 * 1024 * 1024}`, 10) } // default 10MB
});


// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Create patient with optional files
app.post('/api/patients', upload.array('files'), async (req, res) => {
  try {
    const { name, species, breed, owner_name, owner_phone } = req.body;

    if (!name || !species || !breed || !owner_name || !owner_phone) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const { data: patientData, error: insertError } = await supabase
      .from('patients')
      .insert([{ name, species, breed, owner_name, owner_phone }])
      .select()
      .single();

    if (insertError) {
      console.error('DB insert error:', insertError);
      return res.status(400).json({ error: insertError.message });
    }

    const uploadedFiles = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const { originalname, buffer, mimetype } = file;
        const fileName = `${Date.now()}-${originalname}`;
        const safeMimeType = mimetype || 'application/octet-stream';

        const { data: fileData, error: fileError } = await supabase.storage
          .from('patient-files')
          .upload(`patients/${patientData.id}/${fileName}`, buffer, {
            contentType: safeMimeType,
            upsert: false
          });

        if (fileError) {
          console.error('File upload error:', fileError);
          return res.status(400).json({ error: fileError.message });
        }

        // store path in 'files' table
        const { error: filesInsertError } = await supabase.from('files').insert([
          { patient_id: patientData.id, file_path: fileData.path }
        ]);

        if (filesInsertError) {
          console.error('Files table insert error:', filesInsertError);
          // Decide whether to continue or return; here we return
          return res.status(500).json({ error: filesInsertError.message });
        }

        uploadedFiles.push(fileData.path);
      }
    }

    res.json({
      message: 'Patient added successfully',
      patient: patientData,
      files: uploadedFiles
    });
  } catch (err) {
    console.error('Server error (create patient):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper to convert stored file paths to public URLs
function filePathToPublicUrl(filePath) {
  try {
    const { data } = supabase.storage.from('patient-files').getPublicUrl(filePath);
    // getPublicUrl returns { data: { publicUrl } }
    return (data && data.publicUrl) ? data.publicUrl : null;
  } catch (err) {
    console.error('getPublicUrl error:', err);
    return null;
  }
}

// Search patients with filters
app.get('/api/patients/search', async (req, res) => {
  try {
    const { name, id, owner_name, owner_phone } = req.query;

    let query = supabase.from('patients').select('*');

    if (name && name.trim()) query = query.ilike('name', `%${name.trim()}%`);
    if (id && id.trim()) query = query.eq('id', id.trim());
    if (owner_name && owner_name.trim()) query = query.ilike('owner_name', `%${owner_name.trim()}%`);
    if (owner_phone && owner_phone.trim()) query = query.ilike('owner_phone', `%${owner_phone.trim()}%`);

    const { data: patients, error: patientsError } = await query;
    if (patientsError) {
      console.error('Patients query error:', patientsError);
      return res.status(500).json({ error: patientsError.message });
    }

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

        patient.files = (files && files.length > 0)
          ? files.map(f => filePathToPublicUrl(f.file_path)).filter(Boolean)
          : [];

        return patient;
      })
    );

    res.json(patientsWithFiles);
  } catch (err) {
    console.error('Server error (search):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add files to existing patient
app.post('/api/patients/:id/files', upload.array('files'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const uploadedFiles = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const { originalname, buffer, mimetype } = file;
        const fileName = `${Date.now()}-${originalname}`;
        const safeMimeType = mimetype || 'application/octet-stream';
        const { data: fileData, error: fileError } = await supabase.storage
          .from('patient-files')
          .upload(`patients/${id}/${fileName}`, buffer, {
            contentType: safeMimeType,
            upsert: false
          });

        if (fileError) {
          console.error('File upload error:', fileError);
          return res.status(400).json({ error: fileError.message });
        }

        const { error: filesInsertError } = await supabase.from('files').insert([
          { patient_id: id, file_path: fileData.path }
        ]);

        if (filesInsertError) {
          console.error('Files table insert error:', filesInsertError);
          return res.status(500).json({ error: filesInsertError.message });
        }

        uploadedFiles.push(fileData.path);
      }
    }

    res.json({
      message: 'Files added successfully',
      files: uploadedFiles
    });
  } catch (err) {
    console.error('Server error (add files):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*');

    if (patientsError) {
      console.error('Patients fetch error:', patientsError);
      return res.status(500).json({ error: patientsError.message });
    }

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

        patient.files = (files && files.length > 0)
          ? files.map(f => filePathToPublicUrl(f.file_path)).filter(Boolean)
          : [];

        return patient;
      })
    );

    res.json(patientsWithFiles);
  } catch (err) {
    console.error('Server error (get patients):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Appointments routes (unchanged logic, moved above)
app.get('/api/appointments', async (req, res) => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          id,
          name,
          species,
          breed,
          owner_name,
          owner_phone
        )
      `)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Appointments fetch error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(appointments);
  } catch (err) {
    console.error('Server error (appointments):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/appointments/range', async (req, res) => {
  try {
    const { start, end } = req.query;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients (
          id,
          name,
          species,
          breed,
          owner_name,
          owner_phone
        )
      `)
      .order('appointment_date', { ascending: true });

    if (start) query = query.gte('appointment_date', start);
    if (end) query = query.lte('appointment_date', end);

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Appointments range error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(appointments);
  } catch (err) {
    console.error('Server error (appointments range):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { patient_id, appointment_date, duration_minutes, reason, notes } = req.body;
    if (!patient_id || !appointment_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([{
        patient_id,
        appointment_date,
        duration_minutes: duration_minutes || 30,
        reason,
        notes
      }])
      .select(`
        *,
        patients (
          id,
          name,
          species,
          breed,
          owner_name,
          owner_phone
        )
      `)
      .single();

    if (error) {
      console.error('Appointment insert error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (err) {
    console.error('Server error (create appointment):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Appointment delete error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('Server error (delete appointment):', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (ENV=${process.env.NODE_ENV || 'dev'})`);
});
