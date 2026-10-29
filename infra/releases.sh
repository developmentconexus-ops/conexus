#!/usr/bin/env bash
# The digest each release was published as, and the Builder's template built from the same commit,
# kept on this server. A GHCR tag can be rewritten by any workflow of the repository that holds
# `packages: write`; a digest is content-addressed. Voltar atrás deploys only a digest that main's
# Publish deployed and recorded here, with its template. Only a job the runner's hook let through,
# main's, writes this directory (decision 0035, security S36).
#
#   releases.sh record <version> <reference> <template>   writes the record, replacing one of the same version
#   releases.sh find <version>                            prints `<reference> <template>`; a record
#                                                         from before templates prints the reference alone
set -euo pipefail

# The directory is fixed; RELEASES_DIR exists only so scripts/releases.test.ts can plant one.
dir="${RELEASES_DIR:-/var/lib/conexus/releases}"
version_pattern='^v[0-9]+\.[0-9]+\.[0-9]+$'
reference_pattern='^ghcr\.io/developmentconexus-ops/conexus-hub@sha256:[0-9a-f]{64}$'
# What infra/e2b/name.ts names a build: the template and its commit.
template_pattern='^conexus-builder:[0-9a-f]{7,40}$'

usage="usage: releases.sh record <version> <reference> <template> | releases.sh find <version>"
mode="${1:?$usage}"
version="${2:?$usage}"

[[ $version =~ $version_pattern ]] || {
  echo "$version is not a version name" >&2
  exit 1
}

case "$mode" in
  record)
    reference="${3:?$usage}"
    [[ $reference =~ $reference_pattern ]] || {
      echo "$reference is not an image reference by digest" >&2
      exit 1
    }
    template="${4:?$usage}"
    [[ $template =~ $template_pattern ]] || {
      echo "$template is not a template of a commit" >&2
      exit 1
    }
    [ -d "$dir" ] || {
      echo "no records directory at $dir: run infra/setup-runner-hook.sh first" >&2
      exit 1
    }
    next="$(mktemp "$dir/.next.XXXXXX")"
    echo "$reference $template" > "$next"
    mv "$next" "$dir/$version"
    ;;
  find)
    if ! [ -f "$dir/$version" ]; then
      echo "no record of a Publish of $version on this server" >&2
      exit 1
    fi
    read -r reference template < "$dir/$version" || true
    [[ $reference =~ $reference_pattern ]] || {
      echo "the record of $version is not an image reference by digest" >&2
      exit 1
    }
    if [ -z "$template" ]; then
      echo "$reference"
      exit 0
    fi
    [[ $template =~ $template_pattern ]] || {
      echo "the record of $version is not a template of a commit" >&2
      exit 1
    }
    echo "$reference $template"
    ;;
  *)
    echo "$usage" >&2
    exit 1
    ;;
esac
