# TiendaPOS - SAAS

Sistema de Punto de Venta y Gestión Empresarial moderno construido con Next.js 15, React 19 y Tailwind CSS.

## 🚀 Características

*   **Punto de Venta (POS)**: Interfaz optimizada para ventas rápidas con carrito y cálculo automático de impuestos.
*   **Gestión de Inventario**: Control de productos, precios, costos y stock.
*   **Dashboard**: Estadísticas en tiempo real de ventas y alertas de stock bajo.
*   **Tienda Online**: Storefront público configurable integrado con el inventario.
*   **Gestión de Empleados**: Control de acceso y roles.
*   **Modo Demo**: Persistencia local en navegador para pruebas sin backend.

## 🛠️ Tecnologías

*   **Frontend**: Next.js 15 (App Router), React 19, TypeScript
*   **UI**: Tailwind CSS, Shadcn/UI, Lucide Icons
*   **Estado**: TanStack Query (React Query)
*   **Gráficos**: Recharts
*   **Persistencia Demo**: LocalStorage + Adaptador de Servicios
*   **Testing**: Vitest, React Testing Library

## 🏁 Comenzar

1.  Instalar dependencias:
    ```bash
    pnpm install
    ```

2.  Iniciar servidor de desarrollo:
    ```bash
    pnpm dev
    ```

3.  Abrir [http://localhost:3000](http://localhost:3000).

### Credenciales Demo
*   **Usuario**: `admin@tienda.com`
*   **Contraseña**: `123456`

## 🧪 Testing

El proyecto incluye pruebas unitarias con Vitest.

Ejecutar tests:
```bash
pnpm test
```

## 📦 Arquitectura

El proyecto utiliza una arquitectura basada en servicios (`src/services`) que abstrae la lógica de datos. Actualmente configurado en modo "Local Storage" para demostración, pero preparado para conectar con Supabase descomentando el código en los servicios.

*   `src/components`: Componentes UI reutilizables.
*   `src/hooks`: Lógica de negocio y React Query.
*   `src/services`: Capa de datos (Mock/Supabase).
*   `src/lib/local-storage.ts`: Motor de persistencia para el modo demo.
