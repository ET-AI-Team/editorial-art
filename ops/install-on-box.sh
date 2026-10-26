#!/usr/bin/env bash
# One-time privileged setup for editorial-art on the box (10.71.77.228). Run as:
#   sudo bash /data/products/editorial-art/ops/install-on-box.sh
#
# What it does, and nothing else:
#   1. copies this repo's systemd unit and timers into /data/products/_infra/systemd and installs
#      them with the box's own install-units helper
#   2. installs the sudoers drop-in that lets the CI runner restart this one service (checked with
#      visudo first)
#   3. enables and starts editorial-art and its three timers, then checks it answers on loopback
#   4. installs the already-configured GitHub Actions runner (/data/abhigyan.raj/actions-runner-
#      editorial-art) as a service, the same way the AI Studio and design-pipeline runners run
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run with sudo" >&2; exit 1; }

REPO=/data/products/editorial-art
INFRA=/data/products/_infra
UNITS=(editorial-art.service editorial-art-purge.service editorial-art-purge.timer editorial-art-health.service editorial-art-health.timer editorial-art-sweep.service editorial-art-sweep.timer)

for u in "${UNITS[@]}"; do install -m 664 -g et-product-dev "$REPO/ops/$u" "$INFRA/systemd/$u"; done
"$INFRA/bin/install-units" "${UNITS[@]}"

visudo -cf "$REPO/ops/sudoers-editorial-art"
install -m 440 -o root -g root "$REPO/ops/sudoers-editorial-art" /etc/sudoers.d/editorial-art

systemctl daemon-reload
systemctl enable --now editorial-art.service
systemctl enable --now editorial-art-purge.timer editorial-art-health.timer editorial-art-sweep.timer

for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:7202/ready >/dev/null 2>&1; then echo "editorial-art is ready on 127.0.0.1:7202"; break; fi
  sleep 2
done
systemctl --no-pager --lines=0 status editorial-art.service | head -3

RUNNER=/data/abhigyan.raj/actions-runner-editorial-art
if [ -f "$RUNNER/.runner" ] && ! systemctl list-units --type=service --all | grep -q 'actions.runner.ET-AI-Team-editorial-art'; then
  (cd "$RUNNER" && ./svc.sh install abhigyan.raj && ./svc.sh start)
fi
