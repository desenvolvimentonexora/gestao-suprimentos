#!/usr/bin/env node
// Cria o usuário admin de demonstração via Admin API do Supabase.
// Roda depois de `supabase/seed/0001_demo.sql`. Requer SUPABASE_SERVICE_ROLE_KEY
// em variável de ambiente — nunca commitar essa chave nem usá-la no front.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const tenantId = '00000000-0000-0000-0000-000000000001'
const email = 'admin@construtora-beta.nexora.com'
const password = 'TrocarNoPrimeiroAcesso!123'

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.',
  )
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

if (error) {
  console.error('Erro ao criar usuário admin:', error.message)
  process.exit(1)
}

const { error: profileError } = await admin.from('users').insert({
  id: data.user.id,
  tenant_id: tenantId,
  full_name: 'Admin Construtora Beta',
  email,
})

if (profileError) {
  console.error('Erro ao criar perfil do admin:', profileError.message)
  process.exit(1)
}

const { data: adminRole } = await admin
  .from('roles')
  .select('id')
  .eq('tenant_id', tenantId)
  .eq('name', 'admin')
  .single()

if (adminRole) {
  await admin
    .from('user_roles')
    .insert({ user_id: data.user.id, role_id: adminRole.id, tenant_id: tenantId })
}

console.log(`Usuário admin criado: ${email} / ${password}`)
