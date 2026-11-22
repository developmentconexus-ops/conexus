#!/usr/bin/env bash
# Laboratório: só a gravação da U4 (lab/p3-u4.sh sem o P3), com um órfão novo em lab/orfao.txt.
set -euo pipefail
SO_U4=1 exec bash "$(dirname "$0")/p3-u4.sh"
