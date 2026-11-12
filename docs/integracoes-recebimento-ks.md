# Recebimento KS (ENT-08) — Contrato de Integrações e Pendências

> Processo: ENTRADAS → Recebimento KS · Painel de Consulta e Acompanhamento de Envios
> Status: **CONTRATO — nenhuma chamada real implementada.** A tela opera em modo
> demonstração sobre a coleção `recebimentos_ks_demo` (migrations 0010, 0011 e 0013).

## 1. Princípios

- O Nº Envio **não** é presumido igual ao número de transporte SAP (TKNUM). O mapeamento
  entre os dois identificadores é uma pendência documentada (seção 4).
- Nenhuma mensagem de "operação SAP concluída" pode ser exibida com dados simulados.
- O processamento SAP real permanece bloqueado até as regras ABAP serem fornecidas.

## 2. Fontes de dados por domínio

| Sistema             | Objetos previstos                                                                           | Uso no painel                                                     | Status   |
| ------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| **SAP ECC**         | Documentos, remessas (VTTP/LIKP), materiais (MARA), lotes (MCHA/MCHB), movimentações (MSEG) | Origem oficial do envio, blocos, lotes e movimentações de entrada | Pendente |
| **HUB WMS**         | Blocos, RFID, estoque                                                                       | Leitura de blocos e etiquetas RFID na conferência                 | Pendente |
| **HUB MES 4.0**     | Produção/preparação de blocos                                                               | Origem da produção dos blocos enviados                            | Pendente |
| **HUB Faturamento** | Status do recebimento                                                                       | Confirmação do status Recebido no sistema de origem               | Pendente |

## 3. Estrutura atual (demonstração)

- Coleção `recebimentos_ks_demo`: 9 envios (1800010001–1800010009) com datas
  **relativas** à data de execução da migration 0013 (ontem/hoje/semana/mês corrente),
  cobrindo os 3 status (Programado, Em Trânsito, Recebido) e situações adicionais
  (recebimento parcial, divergência de peso) — exibidas, sem alterar o status.
- Campos de painel adicionados na 0013: `status`, `origem`, `destino`,
  `data_programada`, `data_saida`, `data_recebimento`, `peso_previsto`,
  `peso_enviado`, `peso_recebido`, `situacao_adicional`.

## 4. Pendências documentadas

1. **Regras SAP do Recebimento KS (ABAP)** — programa/transação responsável pelo
   lançamento da entrada; sem elas o botão Executar segue bloqueado.
2. **Mapeamento Nº Envio ↔ transporte SAP (TKNUM)** — definir se o Nº Envio é um
   número próprio do HUB, de qual sistema ele origina e como se relaciona com a
   remessa SAP; fonte oficial ainda não informada.
3. **Unidade de origem/destino** — confirmar códigos oficiais das unidades
   (ex.: "Matriz 0100", "Filial 0200", "Filial 0300") e do destino KS.
4. **Situações adicionais** — confirmar com SAP quais situações (cancelamento,
   recebimento parcial, divergência) são informadas pelo sistema de origem e como
   devem ser exibidas sem alterar o status original.
