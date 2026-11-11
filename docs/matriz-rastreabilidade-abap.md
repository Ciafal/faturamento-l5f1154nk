# Matriz de rastreabilidade ABAP → HUB — Faturamento Ciafal (SAPMZSD076)

Processo SAI-01 · Saídas · HUB CIAFAL | FATURAMENTO
Tela HUB: `/processos/saidas/faturamento-vendas` (`src/pages/FaturamentoCiafalForm.tsx`)

## 1. Mapeamento de campos e rotinas

| #   | Rotina / objeto ABAP                     | Descrição                                            | Situação no HUB                                                                                                                   | Onde                                                   |
| --- | ---------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `F_LOAD_TRANSPORTE`                      | Consultar existência em VTTK                         | ✅ Implementado (demo: coleção `transportes_faturamento`, filtro `process_type='faturamento_ciafal'`)                             | `src/services/transportesFaturamento.ts`               |
| 2   | `F_LOAD_TRANSPORTE`                      | Buscar remessas em VTTP                              | ✅ Implementado (demo — remessas vêm nos lotes gravados)                                                                          | idem                                                   |
| 3   | `F_LOAD_TRANSPORTE`                      | Itens em LIPS                                        | ✅ Implementado (demo — itens vêm nos lotes gravados)                                                                             | idem                                                   |
| 4   | `F_LOAD_TRANSPORTE`                      | Descrição do material em MAKT                        | ✅ Implementado (demo — campo `denominacao` gravado)                                                                              | idem                                                   |
| 5   | `F_LOAD_TRANSPORTE`                      | Preencher tabela (remessas, materiais, lotes, pesos) | ✅ Implementado (tabela de 11 colunas)                                                                                            | `src/pages/FaturamentoCiafalForm.tsx`                  |
| 6   | `ZPPR053` (chamada do F_LOAD_TRANSPORTE) | Buscar/ler dados RFID                                | 🟡 **Pendente de fonte ABAP** — demo já traz o resultado RFID por lote                                                            | `transportesFaturamento.ts` + dados demo               |
| 7   | `F_LOAD_TRANSPORTE`                      | Comparar lotes/quantidades RFID × coletados          | 🟡 Implementado em cima dos dados demo (divergência `lote_rfid ≠ lote_coletado` → status "Divergência RFID")                      | `src/lib/faturamentoCiafal/calculos.ts`                |
| 8   | `F_LOAD_TRANSPORTE`                      | Consultar saldos em MCHB                             | 🔴 **Pendente de fonte ABAP** — saldos não calculados no HUB, apenas status demo                                                  | —                                                      |
| 9   | `F_LOAD_TRANSPORTE`                      | Preencher status de conferência por lote             | ✅ Implementado (demo): "Lote OK", "Saldo estoque", "Saldo remessa", "Excesso peso", "Divergência RFID", "Não consultado"         | `calculos.ts` (`tonalidadeStatusLote`)                 |
| 10  | `F_LOAD_TRANSPORTE`                      | Calcular totais de peso                              | ✅ Implementado (`CALCULAR_RESUMO` abaixo)                                                                                        | `calculos.ts` (`calcularPesos`)                        |
| 11  | `BUSCAR_PESO`                            | Solicitar leitura da balança                         | 🟡 Demo funcional (`adaptadorBalancaSimulado`) — real pendente                                                                    | `src/services/balancaSimulada.ts`                      |
| 12  | `CAPTURA_BALANCA_IP_SAP`                 | Captura da balança por IP no SAP                     | 🔴 **Pendente de fonte ABAP** — produção bloqueada (`adaptadorBalancaFaturamento` → `PRODUCAO_BLOQUEADA`)                         | `src/services/balancaFaturamento.ts`                   |
| 13  | `CALCULAR_RESUMO`                        | Peso Líquido Balança = Peso Bruto − Tara             | ✅ Implementado                                                                                                                   | `calculos.ts`                                          |
| 14  | `CALCULAR_RESUMO`                        | Diferença (t) = Líquido − Coletado                   | ✅ Implementado                                                                                                                   | idem                                                   |
| 15  | `CALCULAR_RESUMO`                        | Diferença (%) = Dif / Coletado × 100 (div/0 tratada) | ✅ Implementado                                                                                                                   | idem                                                   |
| 16  | `EXEC_VT02N`                             | Fechar transporte (VT02N)                            | 🔴 **Pendente de fonte ABAP** — etapa simulada no fluxo "Executar", sem chamada real                                              | `src/pages/faturamentoCiafal/DialogExecutar.tsx`       |
| 17  | `EXEC_ZSDR050`                           | Bloqueio/desbloqueio fiscal                          | 🔴 **Pendente de fonte ABAP** — idem                                                                                              | idem                                                   |
| 18  | `F_UPDATE_DB`                            | Gravação final                                       | 🔴 **Pendente de fonte ABAP** — idem                                                                                              | idem                                                   |
| 19  | `WAITING_NF_APROVE`                      | Autorização da NF-e                                  | 🔴 **Pendente de fonte ABAP** — o fluxo "Executar" NÃO finaliza sem confirmação da autorização da NF-e; lançamento real bloqueado | idem                                                   |
| 20  | Verificação de excesso de peso           | Fator **1,30** sobre a quantidade do item            | ✅ Implementado como checagem pontual de conferência — **não** é tolerância geral de aprovação                                    | `calculos.ts` (`FATOR_EXCESSO_PESO`, `temExcessoPeso`) |

## 2. Status por lote (cores)

| Status                          | Cor      | Origem                                              |
| ------------------------------- | -------- | --------------------------------------------------- |
| Lote OK                         | Verde    | Conferência OK                                      |
| Saldo estoque / Saldo remessa   | Amarelo  | Pendência de saldo (MCHB demo)                      |
| Excesso peso / Divergência RFID | Vermelho | Divergência coletado × RFID ou excesso (fator 1,30) |
| Não consultado / desconhecido   | Cinza    | Sem leitura RFID gravada                            |

## 3. Pendências de integração (bloqueios de produção)

- **SAP (VTTK/VTTP/LIPS/MAKT/MCHB)** — leitura real via RFC/BAPI não homologada.
- **RFID (ZPPR053)** — fonte ABAP não fornecida; leitura real pendente.
- **Balança (CAPTURA_BALANCA_IP_SAP)** — captura real deve ocorrer no backend; pendente.
- **VT02N / ZSDR050 / F_UPDATE_DB / WAITING_NF_APROVE** — fontes ABAP não fornecidas; o
  botão "Executar" roda o fluxo em modo demonstração e permanece bloqueado para
  lançamento real.
