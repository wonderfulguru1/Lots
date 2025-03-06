"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Upload } from "lucide-react"

export default function UploadPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [csvData, setCsvData] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<{ type: "success" | "error" | "idle"; message: string }>({
    type: "idle",
    message: "",
  })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    } else if (!loading && user && !isAdmin) {
      router.push("/view")
    }
  }, [user, loading, router, isAdmin])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)

      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setCsvData(text || "")
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleManualInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCsvData(e.target.value)
    setFile(null)
  }

  const handleUpload = async () => {
    if (!csvData.trim()) {
      setStatus({
        type: "error",
        message: "Please provide CSV data to upload",
      })
      return
    }

    setIsUploading(true)
    setStatus({ type: "idle", message: "" })

    try {
      const lines = csvData.split("\n")
      let successCount = 0
      let errorCount = 0

      for (const line of lines) {
        if (!line.trim()) continue

        const [number, name] = line.split(",").map((item) => item.trim())

        if (!number || !name) {
          errorCount++
          continue
        }

        // Check if this number already exists
        const q = query(collection(db, "pairs"), where("number", "==", number))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          errorCount++
          continue
        }

        // Add the new pair
        await addDoc(collection(db, "pairs"), {
          number,
          name,
        })

        successCount++
      }

      setStatus({
        type: "success",
        message: `Successfully uploaded ${successCount} pairs. ${errorCount > 0 ? `${errorCount} pairs were skipped due to errors or duplicates.` : ""}`,
      })

      // Clear the form
      setCsvData("")
      setFile(null)
    } catch (error) {
      console.error("Error uploading data:", error)
      setStatus({
        type: "error",
        message: "An error occurred while uploading the data. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-light"></div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gold-light">Upload Number-Name Pairs</h1>

      <Card className="border-gold-dark/30 gold-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-gold-light flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload" className="text-foreground/80">
              Upload CSV File
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="mt-1 border-gold-dark/20 focus:border-gold-light focus:ring-gold-light/20"
            />
            <p className="text-sm text-muted-foreground mt-1">CSV format: number,name (one pair per line)</p>
          </div>

          <div className="mt-4">
            <Label htmlFor="manual-input" className="text-foreground/80">
              Or Enter Manually
            </Label>
            <Textarea
              id="manual-input"
              placeholder="123,John Doe&#10;456,Jane Smith"
              value={csvData}
              onChange={handleManualInput}
              rows={8}
              className="mt-1 font-mono border-gold-dark/20 focus:border-gold-light focus:ring-gold-light/20"
            />
          </div>

          {status.type === "success" && (
            <Alert className="mt-4 border-gold-light/30 bg-gold-dark/10">
              <CheckCircle className="h-4 w-4 text-gold-light" />
              <AlertDescription className="text-gold-light">{status.message}</AlertDescription>
            </Alert>
          )}

          {status.type === "error" && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={isUploading || !csvData.trim()}
            className="w-full mt-4 bg-gold-dark hover:bg-gold-dark/80 text-primary-foreground"
          >
            {isUploading ? "Uploading..." : "Upload Pairs"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

