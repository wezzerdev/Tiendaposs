"use client"

import { useState, useEffect } from "react"
import { HexColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCcw } from "lucide-react"

// Función auxiliar para convertir hex a oklch (aproximado para demo)
// En producción, idealmente se usaría una librería como 'culori' o similar
// Para este MVP, inyectaremos el estilo directamente en el root
const updateThemeColor = (color: string) => {
  const root = document.documentElement
  root.style.setProperty("--primary", color)
  root.style.setProperty("--ring", color)
  root.style.setProperty("--sidebar-primary", color)
  root.style.setProperty("--sidebar-ring", color)
  // Nota: Para Tailwind v4 con variables CSS nativas, esto debería actualizarse reactivamente
}

export function ThemeCustomizer() {
  const [color, setColor] = useState("#00BC7D")

  useEffect(() => {
    // Cargar color inicial si existe en localStorage o usar default
    const savedColor = localStorage.getItem("theme-primary")
    if (savedColor) {
      setColor(savedColor)
      updateThemeColor(savedColor)
    }
  }, [])

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    updateThemeColor(newColor)
    localStorage.setItem("theme-primary", newColor)
  }

  const resetColor = () => {
    const defaultColor = "#00BC7D"
    handleColorChange(defaultColor)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>
          Personaliza los colores de tu TiendaPOS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Color Primario</Label>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                >
                  <div 
                    className="h-4 w-4 rounded-full border border-gray-200" 
                    style={{ backgroundColor: color }}
                  />
                  {color}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <HexColorPicker color={color} onChange={handleColorChange} />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={resetColor} title="Restaurar color original">
                <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Este color se aplicará a botones, enlaces activos y elementos destacados.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
