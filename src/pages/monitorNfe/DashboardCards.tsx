// Dashboard de 8 cards do Monitor NF-e — quantidade de documentos por status
// do fluxo HUB. Clicar num card filtra a grade (clique novamente remove o
// filtro). Dados de demonstração (migrations 0014/0015).
import React from 'react'
import { cn } from '@/lib/utils'
import { CARD_STATUS_NFE, type StatusNfe } from '@/types/monitorNfe'

interface Props {
  contagem: Partial<Record<StatusNfe, number>>
  statusAtivo: string
  onClicarCard: (status: StatusNfe) => void
}

const DashboardCards: React.FC<Props> = ({ contagem, statusAtivo, onClicarCard }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
      {CARD_STATUS_NFE.map((card) => {
        const qtd = contagem[card.status] ?? 0
        const ativo = statusAtivo === card.status
        return (
          <button
            key={card.status}
            type="button"
            onClick={() => onClicarCard(card.status)}
            className={cn(
              'rounded-md border bg-white px-3 py-2.5 text-left transition-colors',
              'hover:border-[#004c97] focus:outline-none focus:ring-1 focus:ring-[#004c97]',
              ativo && 'border-[#004c97] ring-1 ring-[#004c97] bg-slate-50',
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={cn('inline-block h-2 w-2 rounded-full shrink-0', card.cor)}
                title={card.status}
              />
              <span className="text-lg font-bold leading-none text-slate-800">{qtd}</span>
            </div>
            <p className="mt-1.5 text-[10.5px] font-medium leading-tight text-slate-500">
              {card.rotulo}
            </p>
          </button>
        )
      })}
    </div>
  )
}

export default DashboardCards
