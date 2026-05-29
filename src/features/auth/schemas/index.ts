import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
})

export const signUpSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome').max(80),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    passwordConfirm: z.string().min(8, 'Confirme sua senha'),
    accepted: z
      .boolean()
      .refine((v) => v === true, 'Você precisa aceitar os termos'),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
