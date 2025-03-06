"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2, ShieldCheck, Download, Heart, MessageSquare } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

type Pair = {
  id: string
  number: string
  name: string
}

type Match = {
  id?: string
  user: string
  userEmail?: string
  pairId: string
  number: string
  name: string
  message?: string
  timestamp: any
}

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth()
  const { isDarkMode } = useTheme()
  const router = useRouter()
  const [pairs, setPairs] = useState<Pair[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editPair, setEditPair] = useState<Pair | null>(null)
  const [editedNumber, setEditedNumber] = useState("")
  const [editedName, setEditedName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    } else if (!loading && user && !isAdmin) {
      router.push("/view")
    }
  }, [user, loading, router, isAdmin])

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isAdmin) return

      try {
        // Fetch pairs
        const pairsSnapshot = await getDocs(collection(db, "pairs"))
        const pairsData = pairsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as { number: string; name: string }),
        }))
        setPairs(pairsData)

        // Fetch matches
        const matchesRef = doc(db, "matches", "all")
        const matchesSnap = await getDoc(matchesRef)
        if (matchesSnap.exists()) {
          const matchesData = matchesSnap.data().matches || []
          setMatches(matchesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchData()
    }
  }, [user, isAdmin])

  const handleEdit = (pair: Pair) => {
    setEditPair(pair)
    setEditedNumber(pair.number)
    setEditedName(pair.name)
    setIsDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editPair) return

    try {
      const pairRef = doc(db, "pairs", editPair.id)
      await updateDoc(pairRef, {
        number: editedNumber,
        name: editedName,
      })

      // Update local state
      setPairs((prev) => prev.map((p) => (p.id === editPair.id ? { ...p, number: editedNumber, name: editedName } : p)))

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error updating pair:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pair?")) return

    try {
      await deleteDoc(doc(db, "pairs", id))
      setPairs((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error("Error deleting pair:", error)
    }
  }

  const handleViewMessage = (match: Match) => {
    setSelectedMatch(match)
    setIsMessageDialogOpen(true)
  }

  const downloadMatchesCSV = () => {
    // Create CSV content
    const headers = ["User", "Email", "Number", "Name", "Message", "Timestamp"]
    const csvRows = [headers]

    matches.forEach((match) => {
      const timestamp = match.timestamp?.toDate
        ? match.timestamp.toDate().toLocaleString()
        : new Date(match.timestamp).toLocaleString()

      csvRows.push([
        match.user || "",
        match.userEmail || "",
        match.number || "",
        match.name || "",
        match.message || "",
        timestamp,
      ])
    })

    // Convert to CSV string
    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `matches-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading || isLoading) {
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gold-light flex items-center gap-2">
        <ShieldCheck className="h-5 w-5" /> Admin Dashboard
      </h1>

      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList className="mb-4 bg-gold-dark/10 border border-gold-dark/20">
          <TabsTrigger
            value="matches"
            className="data-[state=active]:bg-gold-dark data-[state=active]:text-primary-foreground"
          >
            User Matches & Messages
          </TabsTrigger>
          <TabsTrigger
            value="pairs"
            className="data-[state=active]:bg-gold-dark data-[state=active]:text-primary-foreground"
          >
            Number-Name Pairs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          <Card className="border-gold-dark/30 gold-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-gold-light flex items-center gap-2">
                <Heart className="h-5 w-5" /> User Match History
              </CardTitle>
              <Button
                onClick={downloadMatchesCSV}
                variant="outline"
                className="border-gold-dark/20 hover:bg-gold-dark/10 hover:text-gold-light"
              >
                <Download className="h-4 w-4 mr-2" /> Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              {matches.length > 0 ? (
                <div className="rounded-md border border-gold-dark/20 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gold-dark/10">
                      <TableRow className="hover:bg-gold-dark/5 border-b-gold-dark/20">
                        <TableHead className="text-gold-light">User</TableHead>
                        <TableHead className="text-gold-light">Number</TableHead>
                        <TableHead className="text-gold-light">Name</TableHead>
                        <TableHead className="text-gold-light">Message</TableHead>
                        <TableHead className="text-gold-light">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match, index) => (
                        <TableRow key={index} className="hover:bg-gold-dark/5 border-b-gold-dark/20">
                          <TableCell className="font-medium">{match.user}</TableCell>
                          <TableCell>{match.number}</TableCell>
                          <TableCell>{match.name}</TableCell>
                          <TableCell>
                            {match.message ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMessage(match)}
                                className="hover:text-gold-light hover:bg-gold-dark/10 flex items-center gap-1"
                              >
                                <MessageSquare className="h-4 w-4" />
                                View
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">No message</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {match.timestamp?.toDate
                              ? match.timestamp.toDate().toLocaleString()
                              : new Date(match.timestamp).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gold-dark/20 rounded-md">
                  <p className="text-muted-foreground">No matches recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pairs">
          <Card className="border-gold-dark/30 gold-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gold-light">Manage Number-Name Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              {pairs.length > 0 ? (
                <div className="rounded-md border border-gold-dark/20 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gold-dark/10">
                      <TableRow className="hover:bg-gold-dark/5 border-b-gold-dark/20">
                        <TableHead className="text-gold-light">Number</TableHead>
                        <TableHead className="text-gold-light">Name</TableHead>
                        <TableHead className="text-right text-gold-light">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pairs.map((pair) => (
                        <TableRow key={pair.id} className="hover:bg-gold-dark/5 border-b-gold-dark/20">
                          <TableCell className="font-medium">{pair.number}</TableCell>
                          <TableCell>{pair.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(pair)}
                              className="hover:text-gold-light hover:bg-gold-dark/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(pair.id)}
                              className="hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gold-dark/20 rounded-md">
                  <p className="text-muted-foreground">No pairs found. Go to the Upload page to add some.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Pair Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-gold-dark/30 gold-shadow">
          <DialogHeader>
            <DialogTitle className="text-gold-light">Edit Number-Name Pair</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-number" className="text-foreground/80">
                Number
              </Label>
              <Input
                id="edit-number"
                value={editedNumber}
                onChange={(e) => setEditedNumber(e.target.value)}
                className="border-gold-dark/20 focus:border-gold-light focus:ring-gold-light/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground/80">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="border-gold-dark/20 focus:border-gold-light focus:ring-gold-light/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-gold-dark/20 hover:bg-gold-dark/10 hover:text-gold-light"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-gold-dark hover:bg-gold-dark/80 text-primary-foreground">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="border-gold-dark/30 gold-shadow">
          <DialogHeader>
            <DialogTitle className="text-gold-light flex items-center gap-2">
              <Heart className="h-4 w-4" /> Message from {selectedMatch?.user}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-gold-dark/10 rounded-lg border border-gold-dark/20">
              <p className="text-foreground/90 italic whitespace-pre-wrap">{selectedMatch?.message}</p>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Matched with: <span className="text-gold-light">{selectedMatch?.name}</span> (#{selectedMatch?.number})
              </p>
              <p>
                Date:{" "}
                {selectedMatch?.timestamp?.toDate
                  ? selectedMatch.timestamp.toDate().toLocaleString()
                  : new Date(selectedMatch?.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsMessageDialogOpen(false)}
              className="border-gold-dark/20 hover:bg-gold-dark/10 hover:text-gold-light"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

