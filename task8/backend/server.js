const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./images")
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const allowedExts = [".jpg", ".jpeg", ".png", ".pdf"]

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedExts.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."))
    }
  }
})

app.post('/upload', (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message })
    } else if (err) {
      return res.status(400).json({ error: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }
    res.json({ message: "File uploaded successfully", file: req.file })
  })
})

app.listen(3001, () => {
  console.log("Server is running on http://localhost:3001")
})
