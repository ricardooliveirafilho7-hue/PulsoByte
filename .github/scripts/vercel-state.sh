# shellcheck shell=bash
# Consulta o estado agregado dos checks/statuses da Vercel para um commit.
# Usado pelo workflow de merge (Preview e produção). Requer GH_TOKEN e gh.
#
# vercel_state <sha> → imprime: pending | failure | success | missing

vercel_state() {
  local sha="$1"
  local status_states check_states combined
  status_states="$(
    gh api "repos/${GITHUB_REPOSITORY}/commits/${sha}/status" \
      --jq '[.statuses[] | select(.context | test("vercel"; "i")) | .state] | unique | join(",")' \
      2>/dev/null || true
  )"
  check_states="$(
    gh api -H 'Accept: application/vnd.github+json' \
      "repos/${GITHUB_REPOSITORY}/commits/${sha}/check-runs" \
      --jq '[.check_runs[] | select(.name | test("vercel"; "i")) | if .status != "completed" then .status else (.conclusion // "missing") end] | unique | join(",")' \
      2>/dev/null || true
  )"
  combined="${status_states},${check_states}"

  if grep -Eqi 'pending|queued|in_progress|requested|waiting' <<<"${combined}"; then
    echo pending
  elif grep -Eqi 'failure|error|cancelled|timed_out|action_required|startup_failure|stale' <<<"${combined}"; then
    echo failure
  elif grep -Eqi 'success' <<<"${combined}"; then
    echo success
  else
    echo missing
  fi
}
