'use client';

import { useState } from 'react';
import styles from '../../library.module.css';

type Command = { label: string; code: string; note?: string };
const commands: Record<string, Command[]> = {
  'linux-everyday': [
    { label: 'Operating system and kernel', code: 'cat /etc/os-release\nuname -a' },
    { label: 'Disk space and current folder size', code: 'df -h\ndu -sh .' },
    { label: 'Memory and CPU count', code: 'free -h\nnproc' },
    { label: 'Running processes', code: 'ps aux\ntop' },
    { label: 'Inspect a listening port', code: 'ss -ltnp', note: 'Process details can require elevated permissions.' },
    { label: 'Follow a file', code: 'tail -f /path/to/file' },
    { label: 'Inspect a service and follow its logs', code: 'systemctl status SERVICE\njournalctl -u SERVICE -f' },
    { label: 'Measure a command', code: 'time COMMAND', note: 'Replace COMMAND with a command you understand.' },
    { label: 'Create an archive', code: 'zip -r archive.zip folder/', note: 'Requires zip. Confirm the destination and contents.' },
    { label: 'List an archive before extraction', code: 'unzip -l archive.zip', note: 'Inspect unfamiliar archives before extracting them.' },
  ],
  'linux-remote-development': [
    { label: 'Generate an SSH key', code: 'ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519', note: 'Choose a passphrase and avoid overwriting an existing key.' },
    { label: 'Connect to a host', code: 'ssh USER@HOST' },
    { label: 'Forward a local port', code: 'ssh -L 8080:localhost:8000 USER@HOST', note: 'The remote host’s port 8000 is available locally on port 8080 while connected.' },
    { label: 'Start and reattach a tmux session', code: 'tmux new -s work\ntmux attach -t work', note: 'Run the second command later, after detaching or reconnecting.' },
    { label: 'Create a Python environment', code: 'python3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install -r requirements.txt', note: 'Review requirements and use the appropriate project directory.' },
    { label: 'Inspect Git changes', code: 'git status\ngit diff' },
    { label: 'Ollama models', code: 'ollama list\nollama run MODEL', note: 'Replace MODEL with a model name; consult Ollama for downloads and resources.' },
  ],
  'linux-maintenance': [
    { label: 'Inspect Docker storage', code: 'docker system df\ndocker ps -a\ndocker volume ls', note: 'These commands inspect state without removing containers or volumes.' },
    { label: 'Review Debian or Ubuntu package updates', code: 'sudo apt update\napt list --upgradable', note: 'Updating package indexes changes local package metadata; review upgrades before applying them.' },
    { label: 'Try a Netplan configuration', code: 'sudo netplan try', note: 'Only on systems using Netplan. Verify rollback and keep a recovery path for remote hosts.' },
    { label: 'Inspect current swap', code: 'swapon --show\nfree -h' },
    { label: 'Inspect journal disk use', code: 'journalctl --disk-usage' },
  ],
  'windows-ssh-wireless': [
    { label: 'Reduce Microsoft Defender scan CPU usage', code: 'Set-MpPreference -ScanAvgCPULoadFactor 5', note: 'Run PowerShell as administrator. Microsoft documents 5 as the lowest supported nonzero value; the supplied value 1 is outside that range. This is an average scanning CPU target, not a hard cap on Defender. Lower targets can lengthen scans; idle-scan settings can bypass throttling.' },
    { label: 'Check the Defender scanning CPU target', code: 'Get-MpPreference | Select-Object ScanAvgCPULoadFactor', note: 'Record the existing value before changing it so you can restore your previous setting.' },
    { label: 'Generate an SSH key in PowerShell', code: 'ssh-keygen -t ed25519 -f "$env:USERPROFILE\\.ssh\\id_ed25519"', note: 'Protect the private key and do not overwrite an existing key.' },
    { label: 'Show the public key', code: 'Get-Content "$env:USERPROFILE\\.ssh\\id_ed25519.pub"', note: 'Share only the public key with the intended server administrator.' },
    { label: 'Generate a Wi-Fi report', code: 'netsh wlan show wlanreport', note: 'Windows reports where the generated HTML file is saved.' },
  ],
};

export function SystemCommands({ slug }: { slug: string }) {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState('');
  const list = commands[slug];
  if (!list) return null;
  const filtered = list.filter((entry) => `${entry.label} ${entry.code} ${entry.note ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section aria-labelledby="command-reference"><h2 id="command-reference">Command reference</h2>
    <p>Review each command and replace placeholders before running it. Availability and permissions depend on your system.</p>
    <label className={styles.search}><span>Search commands</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search commands" /></label>
    {filtered.map((entry) => <div className={styles.commandCard} key={entry.label}><h3>{entry.label}</h3><pre><code>{entry.code}</code></pre>{entry.note && <p>{entry.note}</p>}<button type="button" onClick={async () => { try { await navigator.clipboard.writeText(entry.code); setCopied(entry.label); } catch { setCopied(''); } }}>Copy command</button>{copied === entry.label && <span role="status"> Copied</span>}</div>)}
    {filtered.length === 0 && <p>No commands found. Try another search.</p>}
  </section>;
}
