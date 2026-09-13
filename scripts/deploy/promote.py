"""Promote an accepted local build with a private, reversible release archive."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shlex
import shutil
import subprocess
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
LIVE = ROOT / 'apps/web/.next-live'
CANDIDATE = ROOT / 'apps/web/.next-candidate'
RUNTIME = Path('/etc/insightginie/runtime.env')
UNITS = ['insightginie-web.service', 'insightginie-analytics-prune.service', 'insightginie-analytics-prune.timer']


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout.strip()


def env_values(path):
    result = {}
    if not path.exists():
        return result
    for line in path.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#') or '=' not in line:
            continue
        key, raw = line.removeprefix('export ').split('=', 1)
        if not re.fullmatch(r'[A-Z][A-Z0-9_]*', key.strip()):
            continue
        values = shlex.split(raw, comments=True)
        result[key.strip()] = values[0] if values else ''
    return result


def write_env(path, values):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temporary = path.with_suffix('.env.tmp')
    with os.fdopen(os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), 'w') as handle:
        for key, value in sorted(values.items()):
            if '\n' in value or '\r' in value:
                raise ValueError('Runtime values must be single-line')
            handle.write(f'{key}={shlex.quote(value)}\n')
    temporary.chmod(0o600)
    temporary.replace(path)


def verify_candidate():
    build_id = (CANDIDATE / 'BUILD_ID').read_text().strip()
    evidence = json.loads((ROOT / 'artifacts/candidate-acceptance.json').read_text())
    if evidence.get('buildId') != build_id or evidence.get('status') != 'passed':
        raise RuntimeError('This candidate has not passed its release acceptance gate')
    return build_id


def check_service():
    for _ in range(20):
        try:
            with urllib.request.urlopen('http://127.0.0.1:3000/api/health/', timeout=3) as response:
                if json.load(response).get('status') == 'ok':
                    for path in ['/tools/cash-runway/', '/ask/', '/insights/', '/research/']:
                        with urllib.request.urlopen('http://127.0.0.1:3000' + path, timeout=5) as page:
                            if page.status != 200:
                                raise RuntimeError('Release page failed')
                    return
        except Exception:
            time.sleep(1)
    raise RuntimeError('Release service failed health verification')


def restore(archive):
    archive = archive.resolve()
    archive.relative_to((ROOT / 'artifacts/releases').resolve())
    if not (archive / 'next-live/BUILD_ID').is_file():
        raise RuntimeError('Archive has no rollback build')
    run('systemctl', 'stop', 'insightginie-web')
    if LIVE.exists():
        LIVE.rename(archive / f'replaced-{time.time_ns()}')
    (archive / 'next-live').rename(LIVE)
    for name in UNITS:
        if (archive / name).exists():
            shutil.copy2(archive / name, Path('/etc/systemd/system') / name)
    if (archive / 'runtime.env').exists():
        shutil.copy2(archive / 'runtime.env', RUNTIME)
        RUNTIME.chmod(0o600)
    run('systemctl', 'daemon-reload')
    run('systemctl', 'start', 'insightginie-web')


def promote():
    build_id = verify_candidate()
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    archive = ROOT / 'artifacts/releases' / f'pre-consolidation-{stamp}'
    archive.mkdir(parents=True, mode=0o700)
    for name in UNITS:
        source = Path('/etc/systemd/system') / name
        if source.exists():
            shutil.copy2(source, archive / name)
    if RUNTIME.exists():
        shutil.copy2(RUNTIME, archive / 'runtime.env')
        (archive / 'runtime.env').chmod(0o600)
    local = env_values(ROOT / '.env')
    runtime = env_values(RUNTIME)
    # Never copy Git, Datadog, CMS or arbitrary .env credentials into the web process.
    for key, pattern in [('ASK_SECURITY_SECRET', r'[a-fA-F0-9]{64}'), ('ADMIN_ACCESS_KEY', r'[A-Za-z0-9_-]{43,}')]:
        value = runtime.get(key) or local.get(key)
        if not value:
            value = secrets.token_hex(32) if key == 'ASK_SECURITY_SECRET' else secrets.token_urlsafe(36)
            with (ROOT / '.env').open('a') as handle:
                handle.write(f'\n{key}={value}\n')
            (ROOT / '.env').chmod(0o600)
        if not re.fullmatch(pattern, value):
            raise RuntimeError(f'{key} is not a valid production configuration')
        runtime[key] = value
    runtime.update({
        'APP_SITE_ORIGIN': 'https://insightginie.com',
        'ANALYTICS_SITE_ORIGIN': 'https://insightginie.com',
        'ANALYTICS_DIRECTORY': '/var/lib/insightginie/analytics',
        'OPERATIONS_DIRECTORY': '/var/lib/insightginie/operations',
        'ADMIN_USERNAME': 'admin', 'ASK_ENABLED': 'true',
    })
    try:
        write_env(RUNTIME, runtime)
        run('systemctl', 'stop', 'insightginie-web')
        LIVE.rename(archive / 'next-live')
        CANDIDATE.rename(LIVE)
        for name in UNITS:
            destination = Path('/etc/systemd/system') / name
            shutil.copy2(ROOT / 'deploy' / name, destination)
            destination.chmod(0o644)
        run('systemctl', 'daemon-reload')
        run('systemctl', 'start', 'insightginie-web')
        check_service()
        run('systemctl', 'enable', '--now', 'insightginie-analytics-prune.timer')
        run('systemctl', 'start', 'insightginie-analytics-prune.service')
    except Exception:
        if (archive / 'next-live/BUILD_ID').exists():
            restore(archive)
        elif (archive / 'runtime.env').exists():
            shutil.copy2(archive / 'runtime.env', RUNTIME)
        raise RuntimeError('Promotion failed; prior release restoration attempted') from None
    receipt = {
        'deployedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'commit': run('git', '-C', str(ROOT), 'rev-parse', 'HEAD'),
        'buildId': build_id, 'service': 'insightginie-web', 'port': 3000,
        'health': 'passed', 'rollbackDirectory': str(archive),
        'runtimeSecretNames': ['ASK_SECURITY_SECRET', 'ADMIN_ACCESS_KEY'],
        'candidateEvidenceSha256': hashlib.sha256((ROOT / 'artifacts/candidate-acceptance.json').read_bytes()).hexdigest(),
        'wordpressCutover': False,
    }
    (ROOT / 'docs/verification/consolidation-deployment.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    actions = parser.add_mutually_exclusive_group(required=True)
    actions.add_argument('--verify-only', action='store_true')
    actions.add_argument('--promote', action='store_true')
    actions.add_argument('--rollback', type=Path)
    args = parser.parse_args()
    if args.verify_only:
        print(json.dumps({'candidateBuildId': verify_candidate(), 'accepted': True}))
    elif args.promote:
        promote()
    else:
        restore(args.rollback)
        print(json.dumps({'restored': True, 'service': 'insightginie-web', 'port': 3000}))
