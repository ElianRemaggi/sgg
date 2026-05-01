import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl border border-border shadow-ambient">
      <div className="text-center space-y-1">
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">SGG</h1>
        <p className="text-sm text-muted-foreground">Sistema de Gestión para Gimnasios</p>
      </div>
      <LoginForm />
    </div>
  )
}
