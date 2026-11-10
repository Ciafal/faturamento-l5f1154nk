import type { ValidacaoRegra } from '@/types/database'

/**
 * Verificações GENÉRICAS de consistência para a tela Faturamento Ciafal.
 * Sem regras fiscais, tipos de movimento ou categorias novas — apenas
 * sanidade de campos e situação da nota, até chegar a especificação
 * funcional (PDF ABAP).
 */
export function validarConsistenciaGenerica(nota: {
  numero_nf: string
  serie_nf: string
  data_emissao?: string
  valor_total: number
  status_recebimento: string
  itens_json: {
    item: string
    material_codigo: string
    quantidade_nf: number
    unidade: string
    valor_unitario: number
    valor_total: number
  }[]
}): ValidacaoRegra[] {
  const regras: ValidacaoRegra[] = []

  regras.push({
    regra: 'Campos obrigatórios da nota',
    status: nota.numero_nf && nota.serie_nf ? 'OK' : 'ERRO',
    mensagem:
      nota.numero_nf && nota.serie_nf
        ? 'Número e série da NF informados'
        : 'Número e/ou série da NF não informados',
  })

  regras.push({
    regra: 'Existência da nota fiscal',
    status: 'OK',
    mensagem: 'Nota encontrada na base de demonstração',
  })

  regras.push({
    regra: 'Data de emissão preenchida',
    status: nota.data_emissao ? 'OK' : 'ERRO',
    mensagem: nota.data_emissao
      ? `Data de emissão: ${nota.data_emissao}`
      : 'Data de emissão ausente',
  })

  regras.push({
    regra: 'Valor total da nota',
    status: nota.valor_total > 0 ? 'OK' : 'ERRO',
    mensagem: `Valor total informado: R$ ${nota.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  })

  if (!nota.itens_json || nota.itens_json.length === 0) {
    regras.push({
      regra: 'Itens da nota',
      status: 'ERRO',
      mensagem: 'A nota não possui itens cadastrados',
    })
    return regras
  }

  regras.push({
    regra: 'Itens da nota',
    status: 'OK',
    mensagem: `${nota.itens_json.length} item(ns) encontrado(s)`,
  })

  for (const item of nota.itens_json) {
    const rotulo = `Item ${item.item || 'N/D'}`
    if (!item.material_codigo) {
      regras.push({
        regra: `${rotulo} — material informado`,
        status: 'ERRO',
        mensagem: 'Código de material ausente no item',
      })
      continue
    }
    if (item.quantidade_nf <= 0) {
      regras.push({
        regra: `${rotulo} — quantidade positiva`,
        status: 'ERRO',
        mensagem: `Quantidade inválida (${item.quantidade_nf}) para o material ${item.material_codigo}`,
      })
      continue
    }
    if (!item.unidade) {
      regras.push({
        regra: `${rotulo} — unidade informada`,
        status: 'ERRO',
        mensagem: 'Unidade de medida ausente no item',
      })
      continue
    }
    const esperado = Number((item.quantidade_nf * item.valor_unitario).toFixed(2))
    const informado = Number(item.valor_total.toFixed(2))
    if (Math.abs(esperado - informado) > 0.01) {
      regras.push({
        regra: `${rotulo} — consistência de valores`,
        status: 'ALERTA',
        mensagem: `Valor do item (R$ ${informado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) difere de quantidade × valor unitário (R$ ${esperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
      })
      continue
    }
    regras.push({
      regra: `${rotulo} — consistência de valores`,
      status: 'OK',
      mensagem: `Material ${item.material_codigo}: ${item.quantidade_nf} ${item.unidade} × R$ ${item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    })
  }

  regras.push({
    regra: 'Situação da nota no fluxo',
    status: nota.status_recebimento === 'aguardando_especificacao' ? 'PENDENTE' : 'OK',
    mensagem:
      nota.status_recebimento === 'aguardando_especificacao'
        ? 'Nota aguardando especificação funcional do processo (regras fiscais não definidas)'
        : `Situação atual: ${nota.status_recebimento}`,
  })

  return regras
}
