import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import File from "../models/file.js"
import { v4 as uuidv4 } from "uuid"
import jwt from "jsonwebtoken"
import User from "../models/user.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Uploads directory setup
const uploadsDir = path.join(__dirname, "..", "uploads")
const filesDir = path.join(uploadsDir, "files")

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true })
}

// Middleware to authenticate user via token (supports both Authorization header and cookies)
const authenticateToken = async (req, res, next) => {
    // Try Authorization header first
    const authHeader = req.headers["authorization"]
    let token = authHeader && authHeader.split(" ")[1]

    // If no Authorization header, try cookies
    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split("=")
            acc[key] = value
            return acc
        }, {})
        token = cookies.token
    }

    if (!token) {
        return res.status(401).json({ error: "Access token required" })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId) // Use ObjectId for internal auth
        if (!user) {
            return res.status(401).json({ error: "User not found" })
        }
        req.user = user
        next()
    } catch (err) {
        return res.status(403).json({ error: "Invalid token" })
    }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create user-specific and file-specific directory
        const userId = req.user.uuid
        const fileId = req.body.fileId || uuidv4()
        req.fileId = fileId // Store for later use

        const userDir = path.join(filesDir, userId)
        const fileDir = path.join(userDir, fileId)

        // Ensure directories exist
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true })
        }
        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true })
        }

        cb(null, fileDir)
    },
    filename: function (req, file, cb) {
        // Keep original filename
        cb(null, file.originalname)
    },
})

// File filter for security
const fileFilter = (req, file, cb) => {
    // Add file type restrictions if needed
    const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
        "application/zip",
        "application/x-rar-compressed",
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "audio/mpeg",
        "audio/wav",
    ]

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("File type not allowed"), false)
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: fileFilter,
})

// File upload endpoint
router.post(
    "/upload",
    authenticateToken,
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" })
            }

            const { parentId } = req.body
            const userId = req.user.uuid
            const fileId = req.fileId || uuidv4()

            // Get file extension
            const extension = path.extname(req.file.originalname).substring(1)

            // Create file record in database
            const fileRecord = new File({
                id: fileId,
                name: req.file.originalname,
                type: "file",
                size: req.file.size,
                mimeType: req.file.mimetype,
                extension: extension,
                parentId: parentId || null,
                ownerId: userId,
                path: `files/${userId}/${fileId}/${req.file.originalname}`,
            })

            await fileRecord.save()

            res.json({
                success: true,
                fileId: fileId,
                fileName: req.file.originalname,
                size: req.file.size,
                path: fileRecord.path,
            })
        } catch (error) {
            console.error("Upload error:", error)

            // Clean up file if database save failed
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }

            res.status(500).json({ error: error.message })
        }
    }
)

// File download endpoint
router.get("/download/:fileId", authenticateToken, async (req, res) => {
    try {
        const { fileId } = req.params
        const userId = req.user.uuid // Find file in database - check if user owns it or if it's shared with them
        const file = await File.findOne({
            id: fileId,
            type: "file",
            deleted: false,
            $or: [
                { ownerId: userId },
                { sharedWith: { $in: [req.user._id.toString()] } },
                { sharedWithTeams: { $exists: true, $ne: [] } },
            ],
        })

        if (!file) {
            return res.status(404).json({ error: "File not found" })
        }

        // Construct file path
        const filePath = path.join(uploadsDir, file.path)

        // Check if file exists on disk
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found on disk" })
        }

        // Set appropriate headers
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${file.name}"`
        )
        res.setHeader(
            "Content-Type",
            file.mimeType || "application/octet-stream"
        )

        // Stream file to response
        const fileStream = fs.createReadStream(filePath)
        fileStream.pipe(res)
    } catch (error) {
        console.error("Download error:", error)
        res.status(500).json({ error: error.message })
    }
})

// Get file for viewing (without download)
router.get("/view/:fileId", authenticateToken, async (req, res) => {
    try {
        const { fileId } = req.params
        const userId = req.user.uuid

        // Find file in database - check if user owns it or if it's shared with them
        const file = await File.findOne({
            id: fileId,
            type: "file",
            deleted: false,
            $or: [
                { ownerId: userId },
                { sharedWith: { $in: [req.user._id.toString()] } },
                { sharedWithTeams: { $exists: true, $ne: [] } },
            ],
        })

        if (!file) {
            return res.status(404).json({ error: "File not found" })
        }

        // Construct file path
        const filePath = path.join(uploadsDir, file.path)

        // Check if file exists on disk
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found on disk" })
        }

        // Set appropriate headers for inline viewing
        res.setHeader(
            "Content-Type",
            file.mimeType || "application/octet-stream"
        )
        res.setHeader("Content-Disposition", `inline; filename="${file.name}"`)

        // Stream file to response
        const fileStream = fs.createReadStream(filePath)
        fileStream.pipe(res)
    } catch (error) {
        console.error("View error:", error)
        res.status(500).json({ error: error.message })
    }
})

// Profile picture upload endpoint
router.post("/upload/profile", authenticateToken, (req, res) => {
    // Configure multer specifically for profile pictures
    const profilePictureStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const profilePicturesDir = path.join(uploadsDir, "profile-pictures")

            // Ensure directory exists
            if (!fs.existsSync(profilePicturesDir)) {
                fs.mkdirSync(profilePicturesDir, { recursive: true })
            }

            cb(null, profilePicturesDir)
        },
        filename: function (req, file, cb) {
            // Generate unique filename with timestamp and original extension
            const extension = path.extname(file.originalname)
            const uniqueName = `${Date.now()}_${Math.random()
                .toString(36)
                .substring(7)}${extension}`
            cb(null, uniqueName)
        },
    })

    const profileUpload = multer({
        storage: profilePictureStorage,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
        },
        fileFilter: (req, file, cb) => {
            // Only allow image files for profile pictures
            const allowedMimes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
            ]

            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true)
            } else {
                cb(
                    new Error(
                        "Only image files are allowed for profile pictures"
                    ),
                    false
                )
            }
        },
    }).single("profilePicture")

    profileUpload(req, res, async (err) => {
        if (err) {
            console.error("Profile upload error:", err)
            return res.status(400).json({ error: err.message })
        }

        try {
            if (!req.file) {
                return res
                    .status(400)
                    .json({ error: "No profile picture uploaded" })
            }

            res.json({
                success: true,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
            })
        } catch (error) {
            console.error("Profile picture upload error:", error)

            // Clean up file if there was an error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }

            res.status(500).json({ error: error.message })
        }
    })
})

// Profile picture upload endpoint (for backward compatibility)
router.post(
    "/upload-profile-picture",
    authenticateToken,
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" })
            }

            const userId = req.user.uuid

            // Update user's picture field
            await User.findByIdAndUpdate(req.user._id, {
                picture: req.file.originalname,
            })

            res.json({
                success: true,
                fileName: req.file.originalname,
                size: req.file.size,
            })
        } catch (error) {
            console.error("Profile picture upload error:", error)

            // Clean up file if database save failed
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }

            res.status(500).json({ error: error.message })
        }
    }
)

// Get profile picture (public endpoint)
router.get("/profile/:filename", (req, res) => {
    try {
        const { filename } = req.params
        const profilePicturesDir = path.join(uploadsDir, "profile-pictures")
        const filePath = path.join(profilePicturesDir, filename)

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            // Serve default profile picture
            const defaultPath = path.join(
                profilePicturesDir,
                "default_profile_picture.png"
            )
            if (fs.existsSync(defaultPath)) {
                return res.sendFile(defaultPath)
            } else {
                return res
                    .status(404)
                    .json({ error: "Profile picture not found" })
            }
        }

        // Serve the profile picture
        res.sendFile(filePath)
    } catch (error) {
        console.error("Error serving profile picture:", error)
        res.status(500).json({ error: error.message })
    }
})

// Team picture upload endpoint
router.post("/upload/team", authenticateToken, (req, res) => {
    // Configure multer specifically for team pictures
    const teamPictureStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            const teamPicturesDir = path.join(uploadsDir, "team-pictures")

            // Ensure directory exists
            if (!fs.existsSync(teamPicturesDir)) {
                fs.mkdirSync(teamPicturesDir, { recursive: true })
            }

            cb(null, teamPicturesDir)
        },
        filename: function (req, file, cb) {
            // Generate unique filename with timestamp and original extension
            const extension = path.extname(file.originalname)
            const uniqueName = `${Date.now()}_${Math.random()
                .toString(36)
                .substring(7)}${extension}`
            cb(null, uniqueName)
        },
    })

    const teamUpload = multer({
        storage: teamPictureStorage,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit for team pictures
        },
        fileFilter: (req, file, cb) => {
            // Only allow image files for team pictures
            const allowedMimes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
            ]

            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true)
            } else {
                cb(
                    new Error("Only image files are allowed for team pictures"),
                    false
                )
            }
        },
    }).single("teamPicture")

    teamUpload(req, res, async (err) => {
        if (err) {
            console.error("Team picture upload error:", err)
            return res.status(400).json({ error: err.message })
        }

        try {
            if (!req.file) {
                return res
                    .status(400)
                    .json({ error: "No team picture uploaded" })
            }

            res.json({
                success: true,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
            })
        } catch (error) {
            console.error("Team picture upload error:", error)

            // Clean up file if there was an error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }

            res.status(500).json({ error: error.message })
        }
    })
})

// Team picture serve endpoint
router.get("/team-pictures/:filename", (req, res) => {
    try {
        const filename = req.params.filename
        const teamPicturesDir = path.join(uploadsDir, "team-pictures")
        const filePath = path.join(teamPicturesDir, filename)

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "Team picture not found" })
        }

        // Serve the team picture
        res.sendFile(filePath)
    } catch (error) {
        console.error("Error serving team picture:", error)
        res.status(500).json({ error: error.message })
    }
})

export default router
