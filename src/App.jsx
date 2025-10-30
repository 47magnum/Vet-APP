import { useState } from 'react'

import './App.css'
import AddPet from './pages/new_patient'
import {BrowserRouter as Router, Routes, Route, Link}  from "react-router-dom"
import Home from './pages/home'
import Inspect from './pages/inspect'
import Patients from './pages/sql_search'

function App() {
  const [count, setCount] = useState(0)

  return (

<Router>
            <Routes>
              <Route path='/' element ={<Home/>}/>
              <Route path='/addpet' element ={<AddPet/>}/>
              <Route path = '/inspect' element={<Inspect/>}/>
              <Route path='/patients' element={<Patients/>}/>
            </Routes>
          </Router>
      
  )
}

export default App
