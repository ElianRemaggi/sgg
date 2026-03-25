import { apiClient } from '@/lib/api/client'
import type { ApiResponse, RoutineTemplateDetailDto } from '@/lib/api/types'
import { TemplateEditor } from '../../template-editor'

export default async function EditTemplatePage({
  params,
}: {
  params: { gymId: string; templateId: string }
}) {
  const res = await apiClient<ApiResponse<RoutineTemplateDetailDto>>(
    `/api/gyms/${params.gymId}/coach/templates/${params.templateId}`
  )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Editar Plantilla</h1>
      <TemplateEditor gymId={params.gymId} template={res.data} />
    </div>
  )
}
