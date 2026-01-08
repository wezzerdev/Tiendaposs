import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, BarChart3, Users, ShoppingCart, Zap, Shield, Store } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              TP
            </div>
            TiendaPOS
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Características</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Precios</Link>
            <Link href="#about" className="hover:text-primary transition-colors">Nosotros</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm">
              🚀 Nueva Versión 2.0 Disponible
            </Badge>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Gestiona tu negocio con <span className="text-primary">Inteligencia</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              El sistema POS todo en uno diseñado para potenciar tiendas minoristas. Control de inventario, ventas, empleados y análisis en tiempo real.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-lg">
                  Empezar Ahora <Zap className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Todo lo que necesitas
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Una suite completa de herramientas para llevar tu negocio al siguiente nivel.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <FeatureCard 
              icon={<ShoppingCart className="h-10 w-10 text-primary" />}
              title="Punto de Venta Ágil"
              description="Facturación rápida, intuitiva y compatible con múltiples métodos de pago."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-10 w-10 text-primary" />}
              title="Reportes Avanzados"
              description="Visualiza tus ventas, ganancias y tendencias con gráficos interactivos."
            />
            <FeatureCard 
              icon={<Users className="h-10 w-10 text-primary" />}
              title="Gestión de Empleados"
              description="Controla accesos, turnos y comisiones de tu equipo de trabajo."
            />
            <FeatureCard 
              icon={<Store className="h-10 w-10 text-primary" />}
              title="Multi-Sucursal"
              description="Gestiona múltiples tiendas desde un único panel de control centralizado."
            />
            <FeatureCard 
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Seguridad Total"
              description="Tus datos están protegidos con encriptación de grado empresarial y backups automáticos."
            />
            <FeatureCard 
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="Inventario Real"
              description="Sincronización automática de stock y alertas de bajo inventario."
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center rounded-3xl bg-primary/5 p-8 md:p-12 border border-primary/10">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl font-bold">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Únete a cientos de comercios que ya confían en TiendaPOS para su gestión diaria.
            </p>
            <Link href="/login">
              <Button size="lg" className="mt-4">
                Crear Cuenta Gratis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Store className="h-6 w-6" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Construido por{" "}
              <a href="#" className="font-medium underline underline-offset-4">TiendaPOS Team</a>
              . © 2024 Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="flex flex-col items-center text-center p-4 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="mb-2 rounded-full bg-primary/10 p-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
