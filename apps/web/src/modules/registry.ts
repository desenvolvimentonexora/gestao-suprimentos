import {
  Banknote,
  BarChart3,
  BookUser,
  Building,
  Building2,
  CalendarClock,
  Coins,
  FileText,
  Handshake,
  Home as HomeIcon,
  Landmark,
  LineChart,
  Megaphone,
  Monitor,
  Package,
  Search,
  Send,
  Target,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ModuleStatus } from '../components'

export interface ModuleCardData {
  id: string
  label: string
  description: string
  icon: LucideIcon
  status: ModuleStatus
  /** Presente só nos módulos que já navegam de verdade nesta fase. */
  route?: string
}

// Setores exibidos na Home. Conteúdo do produto (não vocabulário por
// cliente): nomes, descrições e ordem vêm do sistema de referência do
// cliente, fiéis ao pedido — só "Suprimentos" navega nesta fase.
export const sectorRegistry: ModuleCardData[] = [
  {
    id: 'suprimentos',
    label: 'Suprimentos',
    description: 'Requisições, cotações, comparação de orçamentos e fornecedores',
    icon: Package,
    status: 'disponivel',
    route: '/suprimentos',
  },
  {
    id: 'engenharia',
    label: 'Engenharia',
    description: 'Cotações, compras, logística e gestão de obras',
    icon: HomeIcon,
    status: 'disponivel',
  },
  {
    id: 'recursos-humanos',
    label: 'Recursos Humanos',
    description: 'Requisição de pessoal, movimentação e comunicado de férias',
    icon: Users,
    status: 'beta',
  },
  {
    id: 'arquitetura',
    label: 'Arquitetura',
    description: 'Solicitações de cotação de Decoração e Área Comum',
    icon: Landmark,
    status: 'beta',
  },
  {
    id: 'serralheria',
    label: 'Serralheria',
    description: 'EPI, ferramentas e controle de estoque da serralheria',
    icon: Wrench,
    status: 'beta',
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    description: 'Gestão financeira e controle de pagamentos',
    icon: Banknote,
    status: 'em-breve',
  },
  {
    id: 'tecnologia-da-informacao',
    label: 'Tecnologia da Informação',
    description: 'Soluções e suporte de tecnologia da informação',
    icon: Monitor,
    status: 'em-breve',
  },
  {
    id: 'comercial',
    label: 'Comercial',
    description: 'Gestão comercial e relacionamento com clientes',
    icon: Building2,
    status: 'em-breve',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Campanhas e comunicação institucional',
    icon: Megaphone,
    status: 'em-breve',
  },
]

// Ferramentas exibidas dentro do setor Suprimentos (/suprimentos).
// Só "Agenda de Fornecedores" navega para uma página real nesta fase.
export const suprimentosRegistry: ModuleCardData[] = [
  {
    id: 'agenda-fornecedores',
    label: 'Agenda de Fornecedores',
    description: 'Cadastre e gerencie fornecedores por insumo',
    icon: BookUser,
    status: 'disponivel',
    route: '/suprimentos/agenda-fornecedores',
  },
  {
    id: 'analise-solicitacoes',
    label: 'Análise de Solicitações',
    description: 'Avalie prazos e libere SOLs do dia pro Disparo',
    icon: Search,
    status: 'beta',
  },
  {
    id: 'disparo-solicitacoes',
    label: 'Disparo de Solicitações',
    description: 'Importe o Excel diário e dispare e-mails de cotação',
    icon: Send,
    status: 'disponivel',
    route: '/suprimentos/disparo-solicitacoes',
  },
  {
    id: 'em-negociacao',
    label: 'Em Negociação',
    description: 'SOLs com 3 orçamentos prontas para negociar e equalizar',
    icon: Handshake,
    status: 'disponivel',
    route: '/suprimentos/em-negociacao',
  },
  {
    id: 'equalizacao-orcamentos',
    label: 'Equalização de Orçamentos',
    description: 'Compare cotações e gere pedidos de compra',
    icon: BarChart3,
    status: 'disponivel',
    route: '/suprimentos/equalizacao',
  },
  {
    id: 'cobrador-entregas',
    label: 'Cobrador de Entregas',
    description: 'Calendário de pedidos de compra por obra',
    icon: CalendarClock,
    status: 'beta',
  },
  {
    id: 'logistica-interna',
    label: 'Logística Interna',
    description: 'Solicitações de transporte e rotas',
    icon: Truck,
    status: 'disponivel',
  },
  {
    id: 'dashboard-interativo',
    label: 'Dashboard Interativo',
    description: 'KPIs e métricas em tempo real',
    icon: LineChart,
    status: 'beta',
  },
  {
    id: 'leitor-nota-fiscal',
    label: 'Leitor de Nota Fiscal',
    description: 'Leia a NF, identifique itens e prepare o pedido',
    icon: FileText,
    status: 'beta',
  },
  {
    id: 'dados-cadastrais-obras',
    label: 'Dados Cadastrais Obras',
    description: 'Central com as informações e documentações de todas as obras',
    icon: Building,
    status: 'disponivel',
    route: '/suprimentos/unidades',
  },
  {
    id: 'concorrencia-rfq-rfp',
    label: 'Concorrência (RFQ/RFP)',
    description: 'Cotação de listas de insumos com fornecedores',
    icon: Coins,
    status: 'beta',
  },
  {
    id: 'projeto-okr',
    label: 'Projeto OKR',
    description: 'Objetivos e Resultados-Chave — quadro estratégico colaborativo',
    icon: Target,
    status: 'beta',
  },
]
