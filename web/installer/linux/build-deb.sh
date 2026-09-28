#!/bin/sh
# Builds Six's Linux package (.deb: Ubuntu, Debian, Mint and friends open it in their Software app). The package puts
# the download in /opt/six; the "six" command copies it into the user's home the first time (and after each newer
# package), so the app can update itself without admin rights.
#   sh web/installer/linux/build-deb.sh 1.3.0 /path/to/unpacked/Six /path/to/output
set -eu
version="$1"
six="$2"
out="$3"
here="$(cd "$(dirname "$0")" && pwd)"
brand="$here/../../public/brand"
root="$(mktemp -d)/six_$version"

mkdir -p "$root/opt" "$root/usr/bin" "$root/usr/share/applications" "$root/usr/share/icons/hicolor/256x256/apps" "$root/DEBIAN"
cp -R "$six" "$root/opt/six"
rm -f "$root/opt/six/start-six.sh"
cp "$brand/six-256.png" "$root/usr/share/icons/hicolor/256x256/apps/six.png"

cat > "$root/usr/bin/six" <<'SCRIPT'
#!/bin/sh
# Starts Six in the background and opens it in the browser. Six runs from a copy in your home folder so it can update
# itself; this copies the installed version there when it's newer than what you have.
set -e
shipped=/opt/six
home="${XDG_DATA_HOME:-$HOME/.local/share}/six"
version() { sed -n 's/.*"version":"\([^"]*\)".*/\1/p' "$1/web/version.json" 2>/dev/null; }
have="$(version "$home")"
new="$(version "$shipped")"
if [ -z "$have" ] || { [ "$have" != "$new" ] && [ "$(printf '%s\n%s\n' "$have" "$new" | sort -V | tail -n 1)" = "$new" ]; }; then
  mkdir -p "$home"
  # Saved games (data) aren't in the package, so they're never touched.
  for entry in "$shipped"/* ; do
    name="$(basename "$entry")"
    if [ "$name" = runs ]; then cp -R "$entry" "$home/"; else rm -rf "${home:?}/$name"; cp -R "$entry" "$home/"; fi
  done
fi
cd "$home"
nohup ./node/node web/launch.mjs >/dev/null 2>&1 &
SCRIPT
chmod 755 "$root/usr/bin/six"

cat > "$root/usr/share/applications/six.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Six
Comment=Hex tic-tac-toe with a self-trained bot
Exec=six
Icon=six
Terminal=false
Categories=Game;BoardGame;
DESKTOP

size="$(du -sk "$root/opt" | cut -f1)"
cat > "$root/DEBIAN/control" <<CONTROL
Package: six
Version: $version
Architecture: amd64
Maintainer: CixMango <94338494+CixMango@users.noreply.github.com>
Installed-Size: $size
Section: games
Priority: optional
Homepage: https://github.com/CixMango/Six
Description: Hex tic-tac-toe with a self-trained bot
 Six in a row on an endless hex board. Play the Six bot at several strengths, a friend over your network,
 or watch bots play; review your games with the coach. Opens in your browser.
CONTROL

mkdir -p "$out"
dpkg-deb --build --root-owner-group "$root" "$out/Six-$version-Setup-linux.deb"
echo "wrote $out/Six-$version-Setup-linux.deb"
