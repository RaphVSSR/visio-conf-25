export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return (
        Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    )
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
        return "Aujourd'hui"
    } else if (diffDays === 1) {
        return "Hier"
    } else if (diffDays < 7) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`
    } else {
        return date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }
}

export function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

export function getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ppt: "application/vnd.ms-powerpoint",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        txt: "text/plain",
        csv: "text/csv",
        html: "text/html",
        css: "text/css",
        js: "application/javascript",
        json: "application/json",
        xml: "application/xml",
        zip: "application/zip",
        rar: "application/x-rar-compressed",
        tar: "application/x-tar",
        gz: "application/gzip",
        mp3: "audio/mpeg",
        wav: "audio/wav",
        mp4: "video/mp4",
        avi: "video/x-msvideo",
        mov: "video/quicktime",
        webm: "video/webm",
    }

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream"
}

export function getLink(fileId: string): string {
    return `${getApiUrl()}/api/files/view/${fileId}`
}

export function getDownloadLink(fileId: string): string {
    return `${getApiUrl()}/files/download/${fileId}`
}

export function getViewLink(fileId: string): string {
    return `${getApiUrl()}/files/view/${fileId}`
}

// Get API base URL from environment
export function getApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3220"
}

// Get file storage URL from environment
export function getFileStorageUrl(): string {
    return (
        process.env.NEXT_PUBLIC_FILE_STORAGE_URL || `${getApiUrl()}/api/files`
    )
}

// Get profile pictures URL from environment
export function getProfilePicturesUrl(): string {
    return (
        process.env.NEXT_PUBLIC_PROFILE_PICTURES_URL ||
        `${getApiUrl()}/api/files/profile`
    )
}

// Clean and build profile picture URL - fixes double slash issue
export function getProfilePictureUrl(picture?: string): string {
    const baseUrl = getProfilePicturesUrl()

    if (!picture) {
        return `${baseUrl}/default_profile_picture.png`
    }

    // Clean the picture path to avoid double slashes
    let cleanPicture = picture

    // Remove leading slash if present
    if (cleanPicture.startsWith("/")) {
        cleanPicture = cleanPicture.substring(1)
    }

    // Remove "uploads/" prefix if present (handles old S3 paths or incorrect paths)
    if (cleanPicture.startsWith("uploads/")) {
        cleanPicture = cleanPicture.substring("uploads/".length)
    }

    // Remove "profile-pictures/" prefix if present
    if (cleanPicture.startsWith("profile-pictures/")) {
        cleanPicture = cleanPicture.substring("profile-pictures/".length)
    }

    // Build final URL
    return `${baseUrl}/${cleanPicture}`
}

export function getTeamPictureUrl(picture?: string): string {
    if (!picture) {
        // Return null to indicate we should use the Users icon instead
        return ""
    }

    const baseUrl = `${getApiUrl()}/api/files/team-pictures`
    let cleanPicture = picture

    // Clean up the picture path
    if (cleanPicture.startsWith("/")) {
        cleanPicture = cleanPicture.substring(1)
    }

    // Remove "uploads/" prefix if present
    if (cleanPicture.startsWith("uploads/")) {
        cleanPicture = cleanPicture.substring("uploads/".length)
    }

    // Remove "team-pictures/" prefix if present
    if (cleanPicture.startsWith("team-pictures/")) {
        cleanPicture = cleanPicture.substring("team-pictures/".length)
    }

    // Build final URL
    return `${baseUrl}/${cleanPicture}`
}
