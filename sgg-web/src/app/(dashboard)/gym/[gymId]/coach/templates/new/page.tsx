import { TemplateEditor } from '../template-editor'

export default function NewTemplatePage({
  params,
}: {
  params: { gymId: string }
}) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Nueva Plantilla</h1>
      <TemplateEditor gymId={params.gymId} />
    </div>
  )
}
