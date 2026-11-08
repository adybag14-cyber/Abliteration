#!/usr/bin/env bash
set -euo pipefail
qa_image=$1
qa_width=$2
qa_height=$3
qa_page=$4
qa_scheme=$5
qa_scroll_bottom=false
if [[ "$qa_page" == benchmarks-bottom ]]; then qa_page=benchmarks; qa_scroll_bottom=true; fi
[[ "$qa_width" =~ ^[0-9]+$ && "$qa_height" =~ ^[0-9]+$ ]]
qa_xdg=$(mktemp -d /tmp/abliteration-xdg.XXXXXX)
case "$qa_xdg" in /tmp/abliteration-xdg.*) ;; *) exit 2 ;; esac
trap 'rm -rf -- "$qa_xdg"' EXIT
export XDG_RUNTIME_DIR="$qa_xdg"
qa_args=(--workspace /work --width "$qa_width" --height "$qa_height" --page "$qa_page" --quit-after-seconds 8)
if [[ "$qa_scheme" == dark ]]; then qa_args+=(--dark); fi
/app/abliteration-studio "${qa_args[@]}" > "$qa_image.stdout.log" 2> "$qa_image.stderr.log" &
qa_pid=$!
printf 'pid=%s\n' "$qa_pid" > "$qa_image.process.txt"
readlink "/proc/$qa_pid/exe" >> "$qa_image.process.txt"
cat "/proc/$qa_pid/stat" >> "$qa_image.process.txt"
tr '\0' '\n' < "/proc/$qa_pid/cmdline" >> "$qa_image.process.txt"
qa_window=
for qa_attempt in $(seq 1 50); do
    qa_window=$(xdotool search --name '^Abliteration Studio$' 2>/dev/null | head -n 1 || true)
    if [[ -n "$qa_window" ]]; then break; fi
    sleep 0.1
done
[[ -n "$qa_window" ]]
sleep 1
if [[ "$qa_scroll_bottom" == true ]]; then
    xdotool mousemove --window "$qa_window" "$((qa_width - 50))" "$((qa_height / 2))"
    xdotool click --repeat 20 --delay 15 5
    sleep 0.3
fi
import -window "$qa_window" "$qa_image"
wait "$qa_pid"
printf 'exit=0\n' >> "$qa_image.process.txt"
