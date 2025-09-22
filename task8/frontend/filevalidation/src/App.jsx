import React, { useState } from 'react'
import axios from 'axios'
import './App.css'

const App = () => {
  const [file, setFile] = useState()
  const [error, setError] = useState("")

  const upload = () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and PDF files are allowed")
      return
    }

    if (file.size > maxSize) {
      setError("File size must be less than 5MB")
      return
    }

    setError("")

    const formData = new FormData()
    formData.append('file', file)

    axios.post('http://localhost:3001/upload', formData)
      .then(res => alert(res.data.message))
      .catch(err => setError("Upload failed"))
  }

  return (
    <div className='maindiv'>
      <h2>File Upload Validation</h2>
      <p className="note">Allowed files: JPG, PNG, PDF (max 5MB)</p>

      <input
        type='file'
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type='button' onClick={upload}>Upload File</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>

  )
}

export default App
