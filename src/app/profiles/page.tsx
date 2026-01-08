"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEmployees } from "@/hooks/use-employees"
import { Profile } from "@/types"
import { useEmployeeSession } from "@/hooks/use-employee-session"

export default function ProfilesPage() {
  const { employees, isLoading: isLoadingProfiles } = useEmployees()
  const { login } = useEmployeeSession()
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile)
    setPin("")
    setError(null)
  }

  const handleBack = () => {
    setSelectedProfile(null)
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simulación de validación de PIN
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (selectedProfile?.pin && pin === selectedProfile.pin) {
      // PIN correcto
      login(selectedProfile)
      router.push("/dashboard/pos")
    } else {
      setError("PIN incorrecto. Intenta de nuevo.")
      setPin("")
    }
    setIsLoading(false)
  }

  // Filtrar solo empleados activos
  const activeEmployees = employees.filter(e => e.is_active)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 transition-all duration-500">
      
      {/* Header de la Organización */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-3xl font-bold tracking-tight">Tienda Demo</h1>
        <p className="text-muted-foreground">Sucursal Principal</p>
      </div>

      {isLoadingProfiles ? (
          <div className="flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      ) : !selectedProfile ? (
        // VISTA DE SELECCIÓN DE PERFIL
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 animate-in zoom-in-95 duration-500">
          {activeEmployees.length > 0 ? (
            activeEmployees.map((profile) => (
              <div 
                key={profile.id}
                className="group flex flex-col items-center gap-3 cursor-pointer"
                onClick={() => handleProfileSelect(profile)}
              >
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-transparent transition-all group-hover:border-primary group-hover:scale-105 shadow-sm bg-background">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-2xl font-bold bg-secondary text-secondary-foreground">
                      {(profile.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Lock className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg group-hover:text-primary transition-colors">{profile.name || "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground capitalize">{profile.role || "Empleado"}</p>
                </div>
              </div>
            ))
          ) : (
             <div className="col-span-full text-center text-muted-foreground">
                <p>No se encontraron perfiles activos.</p>
                <Button variant="link" onClick={() => router.push("/dashboard/employees")}>
                    Ir a gestionar empleados
                </Button>
             </div>
          )}
        </div>
      ) : (
        // VISTA DE INGRESO DE PIN
        <Card className="w-full max-w-sm animate-in zoom-in-95 duration-300">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={selectedProfile.avatar_url} />
                <AvatarFallback className="text-xl">
                  {(selectedProfile.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{selectedProfile.name || "Sin Nombre"}</CardTitle>
            <CardDescription>Ingresa tu PIN de acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex justify-center">
                <Input 
                  type="password" 
                  maxLength={4}
                  className="text-center text-3xl tracking-[1em] h-14 w-48 font-mono"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  autoFocus
                  placeholder="••••"
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive text-center font-medium animate-in slide-in-from-top-1">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button variant="outline" type="button" onClick={handleBack} disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <Button type="submit" disabled={isLoading || pin.length < 4}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <Button variant="link" className="text-muted-foreground" size="sm" onClick={() => router.push("/dashboard/employees")}>
          Administrar Perfiles
        </Button>
      </div>
    </div>
  )
}
