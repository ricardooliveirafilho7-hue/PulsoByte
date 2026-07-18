#!/usr/bin/env python3
"""Resolve e valida a identidade de uma execução PulsoByte de forma determinística."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime
from zoneinfo import ZoneInfo

TZ_NAME = "America/Sao_Paulo"
RUN_ID_RE = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}-(morning|evening)$")
MODES = ("editorial", "manual-infra-test", "guardian", "infrastructure-audit")
SLOTS = ("morning", "evening")
PERIOD = {"morning": "manha", "evening": "noite"}


class ValidationError(ValueError):
    pass


def valid_iso_date(raw: str) -> date:
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", raw):
        raise ValidationError("editorialDate deve usar exatamente YYYY-MM-DD")
    parsed = date.fromisoformat(raw)
    if f"{parsed.year:04d}-{parsed.month:02d}-{parsed.day:02d}" != raw:
        raise ValidationError("editorialDate não é canônica")
    return parsed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", required=True, choices=MODES)
    parser.add_argument("--slot", choices=SLOTS)
    parser.add_argument("--editorial-date")
    parser.add_argument("--automation-run-id")
    parser.add_argument("--slug")
    parser.add_argument(
        "--now",
        help="ISO datetime opcional para testes; quando sem offset, interpreta em America/Sao_Paulo",
    )
    args = parser.parse_args()

    try:
        if args.mode != "editorial":
            if args.slot or args.automation_run_id:
                raise ValidationError(
                    f"modo {args.mode} não aceita slot nem automationRunId"
                )
            result = {
                "valid": True,
                "mode": args.mode,
                "timezone": TZ_NAME,
                "editorialDate": None,
                "publicationSlot": None,
                "automationRunId": None,
                "writePermission": args.mode == "infrastructure-audit",
            }
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 0

        if not args.slot:
            raise ValidationError("modo editorial exige --slot morning|evening")

        tz = ZoneInfo(TZ_NAME)
        if args.now:
            current = datetime.fromisoformat(args.now)
            if current.tzinfo is None:
                current = current.replace(tzinfo=tz)
            current = current.astimezone(tz)
        else:
            current = datetime.now(tz)

        editorial = valid_iso_date(args.editorial_date) if args.editorial_date else current.date()
        editorial_raw = editorial.isoformat()
        expected = f"{editorial_raw}-{args.slot}"

        if args.automation_run_id:
            supplied = args.automation_run_id
            if not RUN_ID_RE.fullmatch(supplied):
                raise ValidationError(
                    "automationRunId inválido; esperado YYYY-MM-DD-morning|evening"
                )
            if supplied != expected:
                raise ValidationError(
                    f"automationRunId divergente: recebido {supplied}, esperado {expected}"
                )

        if not RUN_ID_RE.fullmatch(expected):
            raise ValidationError("automationRunId calculado falhou na regex obrigatória")

        period = PERIOD[args.slot]
        branch_prefix = f"automation/artigo-{editorial_raw}-{period}-"
        branch = None
        if args.slug:
            slug = args.slug.strip().lower()
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
                raise ValidationError("slug deve usar apenas a-z, 0-9 e hífens simples")
            branch = branch_prefix + slug

        result = {
            "valid": True,
            "mode": "editorial",
            "timezone": TZ_NAME,
            "resolvedAt": current.isoformat(),
            "editorialDate": editorial_raw,
            "publicationSlot": args.slot,
            "automationRunId": expected,
            "automationRunIdRegex": RUN_ID_RE.pattern,
            "periodPtBr": period,
            "branchPrefix": branch_prefix,
            "branch": branch,
            "writePermission": True,
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (ValidationError, ValueError) as exc:
        print(
            json.dumps(
                {
                    "valid": False,
                    "state": "BLOCKED_VALIDATION",
                    "error": str(exc),
                },
                ensure_ascii=False,
                indent=2,
            ),
            file=sys.stderr,
        )
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
