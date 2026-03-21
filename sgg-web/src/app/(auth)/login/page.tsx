import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">SGG</h1>
        <p className="mt-2 text-gray-600">Sistema de Gestión para Gimnasios</p>
      </div>
      <LoginForm />
    </div>
  )
}
