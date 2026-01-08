import { EmployeeList } from "@/components/employees/employee-list"

export default function EmployeesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Empleados</h1>
        <p className="text-muted-foreground">Gestiona el acceso y roles de tu equipo.</p>
      </div>
      <EmployeeList />
    </div>
  )
}
