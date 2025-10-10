// Service for uploading team pictures
export class TeamPictureUploadService {
    private static baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3220"

    static async uploadTeamPicture(file: File): Promise<{
        success: boolean
        filename?: string
        originalName?: string
        size?: number
        error?: string
    }> {
        try {
            const formData = new FormData()
            formData.append("teamPicture", file)

            const uploadUrl = `${this.baseUrl}/api/files/upload/team`
            console.log("Uploading team picture to:", uploadUrl)

            const response = await fetch(uploadUrl, {
                method: "POST",
                body: formData,
                credentials: "include",
                headers: {
                    // Don't set Content-Type, let the browser set it with boundary
                },
            })

            console.log("Upload response status:", response.status)
            console.log("Upload response headers:", response.headers)

            if (!response.ok) {
                const errorText = await response.text()
                console.error("Upload error response:", errorText)

                // Try to parse as JSON, fallback to text error
                try {
                    const errorData = JSON.parse(errorText)
                    throw new Error(errorData.error || "Upload failed")
                } catch {
                    throw new Error(
                        `Upload failed with status ${response.status}: ${errorText}`
                    )
                }
            }

            const result = await response.json()
            console.log("Upload success result:", result)
            return result
        } catch (error) {
            console.error("Team picture upload error:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Upload failed",
            }
        }
    }

    static async deleteTeamPicture(filename: string): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/files/team-pictures/${filename}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            )

            return response.ok
        } catch (error) {
            console.error("Team picture delete error:", error)
            return false
        }
    }
}
