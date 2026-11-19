#!/usr/bin/env bash
# Medição do laboratório de dados: latência de rede a partir da VPS. Só leitura.
# Não toca no Hub, nos contêineres dele nem em variáveis de ambiente de produção.
set -uo pipefail
N=20
hosts=(
  "aws-s3-sao-paulo s3.sa-east-1.amazonaws.com 443"
  "aws-s3-virginia s3.us-east-1.amazonaws.com 443"
  "cloudflare-r2 f9e3127cbabbe576a5071728b3e77bb6.r2.cloudflarestorage.com 443"
  "cloudflare-borda cloudflare.com 443"
  "neon-hub-sao-paulo ep-damp-bonus-b67dbjnt.c-2.sa-east-1.aws.neon.tech 5432"
  "neon-teste-virginia ep-flat-dream-bbqmvc24.c-15.us-east-1.aws.neon.tech 5432"
  "google-storage storage.googleapis.com 443"
)
stats() { grep -v '^$' | sort -n | awk '{a[NR]=$1} END {if(NR==0){print "sem dados"; exit} m=(NR%2)?a[(NR+1)/2]:(a[NR/2]+a[NR/2+1])/2; printf "mediana=%.1f min=%.1f max=%.1f n=%d", m, a[1], a[NR], NR}'; }
echo "medicao: $(date -u +%FT%TZ) host=$(hostname)"
echo "maquina: nproc=$(nproc) $(free -m | awk '/Mem:/{print "mem_total_mb="$2" mem_livre_mb="$7}') carga=\"$(cut -d' ' -f1-3 /proc/loadavg)\" $(df -h / | awk 'NR==2{print "disco_livre="$4}')"
for h in "${hosts[@]}"; do
  read -r nome host porta <<<"$h"
  tcp=(); tls=()
  for i in $(seq $N); do
    t0=$(date +%s%N)
    if timeout 5 bash -c "exec 3<>/dev/tcp/$host/$porta" 2>/dev/null; then
      tcp+=($(( ($(date +%s%N)-t0)/1000 )))
    fi
    if [ "$porta" = 443 ]; then
      r=$(curl -o /dev/null -s -m 10 -w '%{time_connect} %{time_appconnect}' "https://$host/" 2>/dev/null) && tls+=("$(awk '{printf "%.1f", ($2-$1)*1000}' <<<"$r")")
    fi
    sleep 0.2
  done
  printf "%-22s %-60s tcp_connect_ms: %s" "$nome" "$host:$porta" "$(printf '%s\n' "${tcp[@]}" | grep -v '^$' | awk '{printf "%.1f\n",$1/1000}' | stats)"
  [ "$porta" = 443 ] && printf "  handshake_tls_ms: %s" "$(printf '%s\n' "${tls[@]}" | stats)"
  echo
done
