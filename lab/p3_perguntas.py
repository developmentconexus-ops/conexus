"""As perguntas da V3 (`data/conexus-lab-trilho/trilho/fase1b/v3_agente.py`, dialeto do Athena), na área `atual` da
empresa das fases 2 a 4 (o leitor lê a `atual`, não a `bruta`). O SQL é o mesmo da V3, só `bruta.` vira `atual.`.
A P3 da V3 termina no `data_describe` (sem SQL): aqui ela é o `SELECT * ... LIMIT 5` que o describe faz."""
VENDA = "tipmov = 'V' AND statusnfe <> 'C' AND year(dtneg) = 2025"
PERGUNTAS = {
    "P1": f"""SELECT codemp, date_trunc('month', dtneg) AS mes, sum(vlrnota) AS total
              FROM atual.sankhya_tgfcab WHERE {VENDA} GROUP BY 1, 2 ORDER BY 1, 2""",
    "P2": f"""SELECT c.codparc, p.nomeparc, sum(c.vlrnota) AS total FROM atual.sankhya_tgfcab c
              JOIN atual.sankhya_tgfpar p ON p.codparc = c.codparc WHERE {VENDA.replace('tipmov', 'c.tipmov')}
              GROUP BY 1, 2 ORDER BY total DESC NULLS LAST LIMIT 10""",
    "P3": 'SELECT * FROM atual."sankhya_tgfpro" LIMIT 5',
    "P4": """SELECT count(*) FROM atual.mercadolivre_orders o WHERE EXISTS (SELECT 1 FROM atual.sankhya_tgfcab c
             WHERE strpos(c.observacao, cast(o.id AS varchar)) > 0)""",
    "P5": """SELECT count(*) FROM (SELECT regexp_replace(cgc_cpf, '[^0-9]', '') AS doc FROM atual.sankhya_tgfpar
             WHERE cgc_cpf IS NOT NULL GROUP BY 1 HAVING count(*) > 1) d""",
    "P6": """SELECT count(*) FROM atual.mercadolivre_orders o WHERE o.status = 'cancelled' AND EXISTS (
             SELECT 1 FROM atual.sankhya_tgfcab c WHERE strpos(c.observacao, cast(o.id AS varchar)) > 0
             AND c.statusnfe = 'A')""",
    "P7": """SELECT count(DISTINCT co.hs_object_id) FROM atual.crm_companies co JOIN atual.sankhya_tgfpar p
             ON regexp_replace(co.cnpj, '[^0-9]', '') = regexp_replace(p.cgc_cpf, '[^0-9]', '')""",
    "P8": """SELECT count(*), sum(vlrdesdob) FROM atual.sankhya_tgffin WHERE recdesp = 1 AND dtbaixa IS NULL
             AND dtvenc < DATE '2026-11-16' - INTERVAL '120' DAY""",
    "P9": f"""SELECT i.codprod, p.descrprod, sum(i.qtdneg) AS qtd FROM atual.sankhya_tgfite i
              JOIN atual.sankhya_tgfcab c ON c.nunota = i.nunota JOIN atual.sankhya_tgfpro p ON p.codprod = i.codprod
              WHERE {VENDA.replace('tipmov', 'c.tipmov')} AND i.qtdneg > 0 GROUP BY 1, 2 ORDER BY qtd DESC LIMIT 1""",
    "P10": """SELECT round(100.0 * count_if(statusnfe = 'C') / count(*), 2) AS taxa
              FROM atual.sankhya_tgfcab WHERE tipmov = 'V' AND year(dtneg) = 2025""",
}
