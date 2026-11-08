#!/usr/bin/env bash
set -euo pipefail
qa_output=/evidence
mkdir -p "$qa_output"
case "${ABLITERATION_BUILD_SHA:-development}" in
    development) ;;
    *) [[ "$ABLITERATION_BUILD_SHA" =~ ^[0-9a-f]{40}$ ]] ;;
esac
/app/abliteration-cli doctor > "$qa_output/doctor.json"
jq -e --arg expected "${ABLITERATION_BUILD_SHA:-development}" \
    '.build_sha == $expected and .runtime == "Rust" and .python_required == false and .inference_built == true' \
    "$qa_output/doctor.json" >/dev/null
/app/abliteration-studio --version > "$qa_output/gui-version.txt"
/app/abliteration-cli validate-config /app/configs/refusalbench-research.toml > "$qa_output/refusalbench-config.json"
jq -e '.benchmark == "refusalbench" and .automated_run == false and .experimental == true' \
    "$qa_output/refusalbench-config.json" >/dev/null
printf 'file\twidth\theight\tsha256\n' > "$qa_output/screenshots.tsv"
for qa_case in \
    900x600:workspace:light \
    1280x860:workspace:light \
    1600x1000:experiments:light \
    1280x860:benchmarks:light \
    1280x860:benchmarks-bottom:light \
    1280x860:workspace:dark
do
    IFS=: read -r qa_dimensions qa_page qa_scheme <<< "$qa_case"
    IFS=x read -r qa_width qa_height <<< "$qa_dimensions"
    qa_name="${qa_page}-${qa_dimensions}-${qa_scheme}.png"
    xvfb-run -a -s "-screen 0 ${qa_dimensions}x24 -dpi 96" \
        /app/render-one.sh "$qa_output/$qa_name" "$qa_width" "$qa_height" "$qa_page" "$qa_scheme"
    qa_actual=$(identify -format '%wx%h' "$qa_output/$qa_name")
    [[ "$qa_actual" == "$qa_dimensions" ]]
    qa_colors=$(identify -format '%k' "$qa_output/$qa_name")
    [[ "$qa_colors" -gt 64 ]]
    qa_digest=$(sha256sum "$qa_output/$qa_name" | cut -d' ' -f1)
    printf '%s\t%s\t%s\t%s\n' "$qa_name" "$qa_width" "$qa_height" "$qa_digest" >> "$qa_output/screenshots.tsv"
done
sha256sum /app/abliteration-cli /app/abliteration-studio > "$qa_output/binary-sha256.txt"
dpkg-query -W > "$qa_output/container-packages.txt"
jq -n --arg source "${ABLITERATION_BUILD_SHA:-development}" \
    '{schema:1,source_commit:$source,renderer:"tiny-skia",screenshots:6,gui_processes_exited_cleanly:true,model_inference_executed:false,refusalbench_executed:false,desktop_display_shared:false}' \
    > "$qa_output/summary.json"
cat "$qa_output/summary.json"
