export type CepResult = {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export async function fetchCep(cep: string): Promise<CepResult> {
  const digits = cep.replace(/\D/g, '')
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  if (!res.ok) throw new Error('CEP não encontrado')
  const data = await res.json()
  if (data.erro) throw new Error('CEP não encontrado')
  return data as CepResult
}
