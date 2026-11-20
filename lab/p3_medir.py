"""P3, na VPS: as perguntas da V3 pelo Athena, com a credencial da cadeia padrão do SDK.

A chave base chega pelo arquivo de credenciais que `AWS_SHARED_CREDENTIALS_FILE` aponta (nada de chave no código).
O caminho é o do Hub: chave base -> `conexus-lab-hub` (15 min) -> `conexus-e-<empresa>-leitor` com as etiquetas de
sessão `conexus-empresa` e `conexus-papel` (15 min). Uma consulta é o `data_query` da V3: o plano
(`EXPLAIN (TYPE IO, FORMAT JSON)`) e a consulta, em série ou em paralelo, prazo de 5 s com `StopQueryExecution`, só a
primeira página (200 linhas), leitura do estado a cada 0,2 s (o mesmo da V3).

O log é público: só tempos, contagens e códigos. Nenhuma linha de resultado, nenhum número de conta, nenhum ARN."""
import concurrent.futures as cf
import datetime
import json
import os
import re
import statistics
import sys
import time

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from p3_perguntas import PERGUNTAS

EMP = os.environ.get("P3_EMPRESA", "p3vps")
PAPEL = "financeiro"
REGIAO = "us-east-2"
REPETICOES = int(os.environ.get("P3_REPETICOES", "20"))
PRAZO_S, QUERY_ROWS = 5.0, 200
RENOVAR_S = 600                       # o Hub renova a sessão de 15 min antes dos 10 min
CFG = Config(region_name=REGIAO, retries={"mode": "standard", "max_attempts": 3})
CONTA = None


def limpa(txt):
    return re.sub(r"\d{12}", "<conta>", str(txt))[:300]


def erro(e):
    if isinstance(e, ClientError):
        return limpa(f"{e.response['Error']['Code']}: {e.response['Error']['Message']}")
    return limpa(f"{type(e).__name__}: {e}")


def p(rotulo, **kw):
    print(limpa_tudo(json.dumps({"p": rotulo, **kw}, ensure_ascii=False, default=str)), flush=True)


def limpa_tudo(txt):
    return re.sub(r"\d{12}", "<conta>", txt)


def resumo(xs):
    xs = sorted(xs)
    if not xs:
        return None
    p90 = xs[min(len(xs) - 1, int(round(0.9 * (len(xs) - 1))))]
    return {"n": len(xs), "mediana": round(statistics.median(xs), 3), "p90": round(p90, 3),
            "min": round(xs[0], 3), "max": round(xs[-1], 3)}


# ------------------------------------------------------------------------------------------- as sessões
def assumir(sts, arn, nome, tags=None):
    t0 = time.perf_counter()
    kw = {"RoleArn": arn, "RoleSessionName": nome, "DurationSeconds": 900}
    if tags:
        kw["Tags"] = [{"Key": k, "Value": v} for k, v in tags.items()]
    cr = sts.assume_role(**kw)["Credentials"]
    return cr, time.perf_counter() - t0


def sessao_de(cr):
    return boto3.Session(aws_access_key_id=cr["AccessKeyId"], aws_secret_access_key=cr["SecretAccessKey"],
                         aws_session_token=cr["SessionToken"], region_name=REGIAO)


class Hub:
    """Base (cadeia padrão) -> Hub -> leitor da empresa, com renovação."""

    def __init__(self):
        self.base = boto3.Session(region_name=REGIAO)          # a cadeia padrão: env -> arquivo de credenciais
        self.sts = self.base.client("sts", config=CFG)
        self.tempos_hub, self.tempos_leitor, self.renovacoes = [], [], 0
        self.renovar()
        self.primeira = {"hub": self.cr_hub, "leitor": self.cr_leitor, "em": self.em}

    def renovar(self):
        self.cr_hub, s1 = assumir(self.sts, f"arn:aws:iam::{CONTA}:role/conexus-lab-hub", "hub-vps")
        sts_hub = sessao_de(self.cr_hub).client("sts", config=CFG)
        self.cr_leitor, s2 = assumir(sts_hub, f"arn:aws:iam::{CONTA}:role/conexus-e-{EMP}-leitor", f"hub-{EMP}-{PAPEL}",
                                     {"conexus-empresa": EMP, "conexus-papel": PAPEL})
        self.tempos_hub.append(s1)
        self.tempos_leitor.append(s2)
        self.em = time.time()
        self.a = sessao_de(self.cr_leitor).client("athena", config=CFG)
        self.renovacoes += 1

    def athena(self):
        if time.time() - self.em > RENOVAR_S:
            self.renovar()
        return self.a


# ------------------------------------------------------------------------------------------- o data_query da V3
def rodar(a, sql, prazo=PRAZO_S, intervalo=0.2):
    t0 = time.perf_counter()
    try:
        qid = a.start_query_execution(QueryString=sql, WorkGroup=f"conexus-{EMP}-leitor", QueryExecutionContext={
            "Catalog": f"s3tablescatalog/conexus-{EMP}", "Database": "atual"})["QueryExecutionId"]
    except ClientError as e:
        return {"estado": "RECUSADA_NA_PARTIDA", "erro": erro(e), "segundos": time.perf_counter() - t0}
    t1 = time.perf_counter()
    cancelada = False
    while True:
        q = a.get_query_execution(QueryExecutionId=qid)["QueryExecution"]
        st = q["Status"]["State"]
        if st in ("SUCCEEDED", "FAILED", "CANCELLED"):
            break
        if not cancelada and time.perf_counter() - t1 > prazo:
            a.stop_query_execution(QueryExecutionId=qid)
            cancelada = True
        time.sleep(intervalo)
    s = q.get("Statistics", {})
    out = {"estado": st, "cancelada": cancelada, "bytes": s.get("DataScannedInBytes", 0),
           "motor_ms": s.get("EngineExecutionTimeInMillis"), "fila_ms": s.get("QueryQueueTimeInMillis"),
           "planejamento_ms": s.get("QueryPlanningTimeInMillis"), "total_ms": s.get("TotalExecutionTimeInMillis")}
    if st == "SUCCEEDED":
        r = a.get_query_results(QueryExecutionId=qid, MaxResults=QUERY_ROWS + 2)
        out["linhas"] = max(0, len(r["ResultSet"]["Rows"]) - 1)           # só a contagem, nunca o valor
        if sql.lstrip().upper().startswith("EXPLAIN"):
            rows = r["ResultSet"]["Rows"][1:]                                # a 1ª linha é o cabeçalho "Query Plan"
            texto = "\n".join((x["Data"][0].get("VarCharValue") or "") for x in rows)
            try:
                plano = json.loads(texto)
                out["tabelas"] = sorted({f"{t['table']['schemaTable']['schema'].rsplit(':', 1)[-1]}.{t['table']['schemaTable']['table']}"
                                         for t in plano.get("inputTableColumnInfos", [])})
            except ValueError:
                out["tabelas"] = None
    else:
        out["erro_tipo"] = q["Status"].get("AthenaError", {}).get("ErrorType")
    out["segundos"] = time.perf_counter() - t0
    return out


def query(hub, sql, paralelo):
    a = hub.athena()
    t0 = time.perf_counter()
    if paralelo:
        with cf.ThreadPoolExecutor(2) as ex:
            fp, fq = ex.submit(rodar, a, f"EXPLAIN (TYPE IO, FORMAT JSON) {sql}"), ex.submit(rodar, a, sql)
            rp, rq = fp.result(), fq.result()
    else:
        rp = rodar(a, f"EXPLAIN (TYPE IO, FORMAT JSON) {sql}")
        rq = rodar(a, sql) if rp["estado"] == "SUCCEEDED" else {"estado": "NAO_RODOU"}
    return time.perf_counter() - t0, rp, rq


# ------------------------------------------------------------------------------------------- as provas
def provar_base(base):
    """A chave base só assume o papel do Hub: qualquer outra chamada é recusada."""
    out = {}
    for nome, fn in {"athena:ListWorkGroups": lambda: base.client("athena", config=CFG).list_work_groups(),
                     "s3:ListBuckets": lambda: base.client("s3", config=CFG).list_buckets(),
                     "sts:AssumeRole leitor direto": lambda: base.client("sts", config=CFG).assume_role(
                         RoleArn=f"arn:aws:iam::{CONTA}:role/conexus-e-{EMP}-leitor", RoleSessionName="direto",
                         Tags=[{"Key": "conexus-empresa", "Value": EMP}, {"Key": "conexus-papel", "Value": PAPEL}])}.items():
        try:
            fn()
            out[nome] = "PASSOU (não devia)"
        except ClientError as e:
            out[nome] = e.response["Error"]["Code"]
    return out


def vencida(cr, quem):
    try:
        sessao_de(cr).client("sts", config=CFG).get_caller_identity()
        return {"quem": quem, "resultado": "ACEITA (não devia)"}
    except ClientError as e:
        return {"quem": quem, "resultado": "RECUSADA", "erro": erro(e)}


def main():
    global CONTA
    em = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    base = boto3.Session(region_name=REGIAO)
    cred = base.get_credentials()
    p("cadeia", metodo=getattr(cred, "method", None), regiao=REGIAO, em=em)
    t0 = time.perf_counter()
    ident = base.client("sts", config=CFG).get_caller_identity()
    CONTA = ident["Account"]
    p("base", usuario=ident["Arn"].rsplit("/", 1)[-1], get_caller_identity_s=round(time.perf_counter() - t0, 3))
    p("base_so_assume", **provar_base(base))

    hub = Hub()
    # o tempo de assumir: 20 cadeias base -> Hub -> leitor, fora das perguntas
    th, tl = [], []
    sts = base.client("sts", config=CFG)
    for i in range(REPETICOES):
        cr, s1 = assumir(sts, f"arn:aws:iam::{CONTA}:role/conexus-lab-hub", "hub-vps")
        _, s2 = assumir(sessao_de(cr).client("sts", config=CFG), f"arn:aws:iam::{CONTA}:role/conexus-e-{EMP}-leitor",
                        f"hub-{EMP}-{PAPEL}", {"conexus-empresa": EMP, "conexus-papel": PAPEL})
        th.append(s1)
        tl.append(s2)
    p("assumir", hub=resumo(th), leitor=resumo(tl), cadeia=resumo([a + b for a, b in zip(th, tl)]))
    # a etiqueta de outra empresa é recusada (a sessão presa à empresa)
    try:
        assumir(sessao_de(hub.cr_hub).client("sts", config=CFG), f"arn:aws:iam::{CONTA}:role/conexus-e-{EMP}-leitor",
                "outra", {"conexus-empresa": "outra-empresa", "conexus-papel": PAPEL})
        p("etiqueta_de_outra_empresa", resultado="ACEITA (não devia)")
    except ClientError as e:
        p("etiqueta_de_outra_empresa", resultado="RECUSADA", codigo=e.response["Error"]["Code"])

    # aquecer: uma vez cada pergunta, fora da conta
    for nome, sql in PERGUNTAS.items():
        _, rp, rq = query(hub, sql, True)
        p("aquecer", pergunta=nome, plano=rp["estado"], consulta=rq["estado"], cancelada=rq.get("cancelada"),
          linhas=rq.get("linhas"), tabelas=rp.get("tabelas"), erro_tipo=rq.get("erro_tipo"))

    res = {}
    for nome, sql in PERGUNTAS.items():
        serie, paral, motor, fila, plan, cons, bytes_, estados = [], [], [], [], [], [], [], {}
        # alterna série e paralelo, para que a deriva do serviço caia nos dois
        for i in range(REPETICOES):
            for modo in ("serie", "paralelo"):
                tot, rp, rq = query(hub, sql, modo == "paralelo")
                (paral if modo == "paralelo" else serie).append(tot)
                k = f"{modo}:{rq['estado']}{':cancelada' if rq.get('cancelada') else ''}"
                estados[k] = estados.get(k, 0) + 1
                if modo == "paralelo" and rq["estado"] == "SUCCEEDED":
                    motor.append((rq.get("motor_ms") or 0) / 1000)
                    fila.append((rq.get("fila_ms") or 0) / 1000)
                    plan.append(rp["segundos"])
                    cons.append(rq["segundos"])
                    bytes_.append(rq.get("bytes") or 0)
        res[nome] = {"serie": resumo(serie), "paralelo": resumo(paral), "estados": estados,
                     "paralelo_plano_s": resumo(plan), "paralelo_consulta_s": resumo(cons),
                     "motor_s": resumo(motor), "fila_s": resumo(fila),
                     "bytes_mediana": int(statistics.median(bytes_)) if bytes_ else None,
                     "amostras_serie": [round(x, 3) for x in serie], "amostras_paralelo": [round(x, 3) for x in paral]}
        p("pergunta", pergunta=nome, **{k: v for k, v in res[nome].items() if not k.startswith("amostras")})
    p("renovacoes", vezes=hub.renovacoes, hub=resumo(hub.tempos_hub), leitor=resumo(hub.tempos_leitor))

    # a sessão de 15 min vencida: as primeiras credenciais do Hub e do leitor, depois de 900 s
    falta = hub.primeira["em"] + 900 + 30 - time.time()
    if falta > 0 and os.environ.get("P3_TESTE") != "1":
        p("esperando_vencer", segundos=round(falta))
        time.sleep(falta)
    p("sessao_vencida", idade_s=round(time.time() - hub.primeira["em"]),
      hub=vencida(hub.primeira["hub"], "hub"), leitor=vencida(hub.primeira["leitor"], "leitor"))
    try:
        hub.primeira["leitor"] and sessao_de(hub.primeira["leitor"]).client("athena", config=CFG).start_query_execution(
            QueryString="SELECT 1", WorkGroup=f"conexus-{EMP}-leitor")
        p("athena_com_sessao_vencida", resultado="ACEITA (não devia)")
    except ClientError as e:
        p("athena_com_sessao_vencida", resultado="RECUSADA", codigo=e.response["Error"]["Code"])

    os.makedirs("lab/out", exist_ok=True)
    with open("lab/out/p3-medidas.json", "w") as f:
        json.dump({"em": em, "assumir": {"hub": th, "leitor": tl}, "perguntas": res}, f, ensure_ascii=False, indent=1)
    p("fim", arquivo="lab/out/p3-medidas.json")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:      # noqa: BLE001
        p("falhou", erro=erro(e))
        sys.exit(1)
