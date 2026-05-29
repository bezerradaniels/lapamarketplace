import { useQuery } from '@tanstack/react-query'
import type { ComboboxOption } from '@/components/ui'

interface IbgeMunicipio {
  id: number
  nome: string
}

export function useCities(uf: string | null) {
  return useQuery({
    queryKey: ['ibge-cities', uf],
    queryFn: async (): Promise<ComboboxOption[]> => {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
      )
      if (!res.ok) throw new Error('Erro ao carregar cidades')
      const data = (await res.json()) as IbgeMunicipio[]
      return data.map((d) => ({ value: d.nome, label: d.nome }))
    },
    enabled: !!uf,
    staleTime: 24 * 60 * 60 * 1000,
  })
}
