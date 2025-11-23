import { useState } from 'react'

import './App.css'
import AddPet from './pages/new_patient'
import {BrowserRouter as Router, Routes, Route, Link}  from "react-router-dom"
import Home from './pages/home'
import Inspect from './pages/inspect'
import Patients from './pages/sql_search'
import AddFilesToPatient from './pages/AddFilestoPatient'
import Calendar from './pages/calendar'
import NewAppointment from './pages/NewAppointment';
function App() {
  const [count, setCount] = useState(0)

  return (

<Router>
            <Routes>
              <Route path='/' element ={<Home/>}/>
              <Route path='/addpet' element ={<AddPet/>}/>
              <Route path = '/inspect' element={<Inspect/>}/>
              <Route path='/patients' element={<Patients/>}/>
              <Route path="/add-files" element={<AddFilesToPatient />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/new-appointment" element={<NewAppointment />} />
            </Routes>
          </Router>
      
  )
}

export default App
