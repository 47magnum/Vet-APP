import { useState } from 'react'

import './App.css'
import AddPet from './pages/new_patient'
import {BrowserRouter as Router, Routes, Route, Link}  from "react-router-dom"
import "./App.css"
import Home from './pages/home'
import Inspect from './pages/inspect'


function App() {
  const [count, setCount] = useState(0)

  return (

<Router>
            <Routes>
              <Route path='/' element ={<Home/>}/>
              <Route path='/addpet' element ={<AddPet/>}/>
              <Route path = '/inspect' element={<Inspect/>}/>
            </Routes>
          </Router>
      
  )
}

export default App
