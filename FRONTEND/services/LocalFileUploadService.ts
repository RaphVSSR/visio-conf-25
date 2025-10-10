export class LocalFileUploadService {
    private baseUrl: string

    constructor(
        baseUrl: string = process.env.NEXT_PUBLIC_API_URL ||
            "http://localhost:3220"
    ) {
        this.baseUrl = baseUrl
    }

    async uploadFile(
        file: File,
        parentId?: string,
        token?: string
    ): Promise<{
        success: boolean
        fileId?: string
        fileName?: string
        size?: number
        path?: string
        error?: string
    }> {
        try {
            if (!token) {
                throw new Error("Authentication token required")
            }

            const formData = new FormData()
            formData.append("file", file)

            if (parentId) {
                formData.append("parentId", parentId)
            }

            const response = await fetch(`${this.baseUrl}/api/files/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Upload failed")
            }

            return {
                success: true,
                fileId: result.fileId,
                fileName: result.fileName,
                size: result.size,
                path: result.path,
            }
        } catch (error) {
            console.error("File upload error:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Upload failed",
            }
        }
    }

    async uploadProfilePicture(
        file: File,
        token?: string
    ): Promise<{
        success: boolean
        fileName?: string
        size?: number
        error?: string
    }> {
        try {
            if (!token) {
                throw new Error("Authentication token required")
            }

            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch(
                `${this.baseUrl}/api/files/upload-profile-picture`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Upload failed")
            }

            return {
                success: true,
                fileName: result.fileName,
                size: result.size,
            }
        } catch (error) {
            console.error("Profile picture upload error:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Upload failed",
            }
        }
    }

    getDownloadUrl(fileId: string): string {
        return `${this.baseUrl}/api/files/download/${fileId}`
    }

    getViewUrl(fileId: string): string {
        return `${this.baseUrl}/api/files/view/${fileId}`
    }

    async downloadFile(
        fileId: string,
        fileName: string,
        token: string
    ): Promise<void> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/files/download/${fileId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                throw new Error("Download failed")
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Download error:", error)
            throw error
        }
    }
}

export const localFileUploadService = new LocalFileUploadService()
