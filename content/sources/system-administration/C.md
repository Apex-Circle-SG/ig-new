# Linux

## Commands

|**Background**<br>No GUI<br>Resumable<br>Another kind<br>Node kind<br><br>|```Bash<br>nohup <command> &<br>screen -S <name><br>screen -r <name><br>tmux new -t <name><br>tmux attach -s <name><br>pm2 flush<br>pm2 set pm2-logrotate:max_size 1M<br>pm2 set pm2-logrotate:retain 1<br>```|||
|---|---|---|---|
|Clear bash history|```Bash<br>history -c && cat /dev/null > ~/.bash_history<br>```|||
|Clear docker|```Bash<br>docker stop $(docker ps -q) && docker container prune -f && docker rmi $(docker images -q) --force && docker volume prune -f && docker network prune -f && docker builder prune -a -f<br>```|||
|Clear file size|```Bash<br>truncate -s 0 <filename><br>```|||
|Disk read/write<br>Disk space<br>Folder size|```Bash<br>iostat -dxh<br>df -h<br>du -sh<br>```|||
|Fun|```PowerShell<br>curl ascii.live/parrot<br>hollywood<br>fastfetch<br>```|||
|**Git**<br>Set password<br><br>Remove old items<br>Fetch with PAT|```Bash<br>git config --global credential.helper store<br>git add -A && git commit -m "init" && git push<br>git remote set-url origin git@github.com:<ORG>/<REPO>.git<br>git rm -r --cached <REMOVED_ITEM><br>git clone https://<USER>:<PAT>@github.com/<REPO>.git<br>```|||
|Hostname|```Shell<br>hostnamectl set-hostname <new_hostname>    <br>```|||
|Read file end|```Bash<br>tail -f <filename><br>```|||
|Logging|```Bash<br>journalctl -u <log_name> -f<br>journalctl --vacuum-size=100K<br>journalctl --rotate<br>journalctl --vacuum-time=1s<br>find /var/log -type f \( -name "*.gz" -o -regex '.*\.[0-9]+$' \) -delete<br>find /var/log -type f -exec truncate -s 0 {} \;<br>```|||
|**Memory**<br>Check memory<br>Free up memory<br>Disable swap<br>Add swap<br>|```Shell<br>free -h<br>sync; sysctl -w vm.drop_caches=3<br>swapoff -a && rm /swapfile && nano /etc/fstab <br>fallocate -l <size>G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab<br>```|||
|**Network**<br>Edit network<br>Test new config<br>Disable IPv6<br><br><br>Monitor|```Bash<br>nano /etc/netplan/<interface_name><br>netplay try<br>nano /etc/sysctl.conf<br>net.ipv6.conf.all.disable_ipv6 = 1<br>net.ipv6.conf.default.disable_ipv6 = 1<br>net.ipv6.conf.lo.disable_ipv6 = 1<br>sysctl -p<br>wavemon / <br>```|||
|Ollama<br>|```Bash<br>ollama serve<br>ollama create <MODEL_NAME> -f <FILE><br>ollama run <MODEL_TO_DOWNLOAD><br>ollama list<br>ollama rm <MODEL_TO_DELETED><br>ollama run <MODEL> "/no_think <PROMPT>"<br>```|||
|**OpenCode**<br>Cleanup<br>|```Plain Text<br>opencode session list --format json | jq -r '.[].id' | xargs -I{} opencode session delete {}<br>```|||
|**Process**<br>Processes info<br>GPU process info<br>Find process<br>Check process port<br>Update process priority<br>How many processors|```Bash<br>top / htop / btop / bpytop / vtop glances<br>nvitop / nvtop / nvidia-smi -l 1<br>ps aux | grep <APP><br>lsof -i :<PORT><br>renice -20 -p <process ID><br>nproc<br>```|||
|**Python**<br>Create env<br>Install dependencies<br>Install dependencies \(CN\)|```Shell<br>python3 -m venv .venv && source .venv/bin/activate<br>python3 -m pip install --break-system-packages --ignore-installed -r requirements.txt<br>pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple<br>```|||
|Run an URL|```Shell<br>curl -X POST <url> -d <content><br>```|||
|Service manipulation|```Bash<br>systemctl [restart | start | stop | enable | disable | status] <service><br>```|||
|**Shell**<br>Login<br>Port forwarding<br>Login with pem<br>File creation<br>Permission set |```Bash<br>ssh -Y user@host<br>ssh -L <PORT>:localhost:<PORT> user@host<br>ssh-keygen -t ed25519 -f <path/name> # put pub content to .ssh/authorized_keys<br>mkdir -p ~/.ssh && chmod 700 ~/.ssh && nano ~/.ssh/authorized_keys # paste PUB<br>chmod 600 ~/.ssh/authorized_keys<br>```|||
|Show execution period|```Bash<br>time <command><br>```|||
|Super user|```Bash<br>sudo su<br>```|||
|Text editor|```Bash<br>nano<br>```|||
|Untar<br>Zip<br>Unzip|```Bash<br>lz4 -d <filename>.tar.lz4 | tar -xvf - > progress.log 2>&1 &<br>zip -r <filename>.zip <folder><br>unzip <filename>.zip<br>```|||
|Update<br>Set LTS to normal<br>Update manager|```Bash<br>apt update && apt dist-upgrade -y && apt autoremove --purge -y && apt autoclean<br>nano /etc/update-manager/release-upgrades<br>do-release-upgrade<br>```|||
|Write read speed|```Bash<br>dd if=/dev/zero of=testfile bs=1G count=1 oflag=direct<br>dd if=testfile of=/dev/null bs=1G count=1 iflag=direct<br>rm testfile<br>```|||
|Version|```Bash<br>lsb_release -a<br>cat /etc/os-release<br>uname -a<br>```|||
|Ultimate Clean up<br>|```Bash<br>systemctl disable cron<br>systemctl disable systemd-timesyncd<br>systemctl disable apt-daily.service<br>systemctl disable apt-daily.timer<br>systemctl disable apt-daily-upgrade.timer<br>systemctl disable apt-daily-upgrade.service<br>systemctl disable systemd-journald<br>apt purge -y perl cloud-init snapd logrotate man-db info tasksel installation-report firmware-linux-free rsyslog wtmpdb gcc gcc-14 gcc-14-x86-64-linux-gnu cpp cpp-14 cpp-x86-64-linux-gnu binutils binutils-common binutils-x86-64-linux-gnu make manpages manpages-dev groff-base python3 python3-minimal python3.13 python3.13-minimal python3-apt python3-debian python3-requests python3-urllib3 python3-chardet python3-certifi cloud-guest-utils cloud-image-utils cloud-utils cloud-initramfs-growroot crash kdump-tools kexec-tools pahole vim vim-common vim-runtime vim-tiny inetutils-telnet traceroute netcat-traditional lrzsz iamerican ibritish wamerican dictionaries-common ispell intel-microcode apport plymouth irqbalance speech-dispatcher network-manager rpcbind nfs-common ufw<br>sudo apt autoremove --purge -y<br>sudo apt clean<br>apt install linux-image-cloud-amd64 nginx ca-certificates locales -y<br>rm -rf /usr/share/doc/*<br>rm -rf /usr/share/man/*<br>rm -rf /usr/share/locale/*<br>rm -rf /var/cache/apt/*<br>rm /etc/update-motd.d/*<br>mkdir -p /etc/systemd/journald.conf.d<br>echo -e "[Journal]\nStorage=volatile" > /etc/systemd/journald.conf.d/volatile.conf<br>echo 'LANG=C' > /etc/default/locale<br>echo 'DPkg::Post-Invoke { "rm -f /var/log/dpkg.log"; };' > /etc/apt/apt.conf.d/99no-logs<br>echo 'APT::Install-Recommends "false";' > /etc/apt/apt.conf.d/99lean<br>echo 'APT::Install-Suggests "false";' > /etc/apt/apt.conf.d/99lean<br>echo 'path-exclude=/usr/share/doc/*' > /etc/dpkg/dpkg.cfg.d/lean<br>echo 'path-exclude=/usr/share/man/*' > /etc/dpkg/dpkg.cfg.d/lean<br>echo 'path-exclude=/usr/share/locale/*' > /etc/dpkg/dpkg.cfg.d/lean<br>echo 'Storage=volatile' > /etc/systemd/journald.conf<br>echo 'RuntimeMaxUse=20M' > /etc/systemd/journald.conf<br>echo 'RuntimeKeepFree=10M' > /etc/systemd/journald.conf<br>echo 'MaxLevelStore=warning' > /etc/systemd/journald.conf<br>echo 'LogLevel=warning' > /etc/systemd/system.conf<br>echo -e "kernel.printk = 3 3 3 3" >> /etc/sysctl.conf<br>touch /var/log/wtmp<br>touch /var/log/btmp<br>systemctl restart systemd-journald<br>uname -r<br>dpkg --list | grep linux-image<br>apt remove -y --purge linux-image-<version><br>update-grub<br>```|||

## Privacy OS

[https://www.debian.org/]()

[https://www.qubes-os.org/]()



[https://www.fedoraproject.org/]()

[https://tails.net/]()



[https://www.kicksecure.com/]()

[https://mofolinux.com/]()

[https://www.whonix.org/]()



[https://www.kodachi.cloud/wiki/bina/index.html]()

[https://www.parrotsec.org/]()



## Windows

|**SSH Login**<br>Generate new key<br>Permission reset<br>Permission set only user<br>Copy the pub content|```PowerShell<br>ssh-keygen -t ed25519 -f ./key.pem<br>icacls.exe ./key.pem /inheritance:r<br>icacls.exe ./key.pem /grant:r "${env:USERNAME}:(R,W)"<br>Get-Content ./key.pem.pub<br>```<br>|||
|---|---|---|---|
|Wireless Report|```PowerShell<br>netsh wlan show wlanreport<br>```|||



