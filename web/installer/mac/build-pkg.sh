#!/bin/sh
# Builds Six's macOS installer: Six.app (the unpacked download inside, started with no Terminal window) wrapped in a
# branded Installer wizard. It installs into the user's own Applications folder, so no admin password, and the app can
# update itself in place later.
#   sh web/installer/mac/build-pkg.sh 1.3.0 /path/to/unpacked/Six /path/to/output
set -eu
version="$1"
six="$2"
out="$3"
here="$(cd "$(dirname "$0")" && pwd)"
brand="$here/../../public/brand"
work="$(mktemp -d)"

app="$work/root/Six.app"
mkdir -p "$app/Contents/MacOS" "$app/Contents/Resources"
cp -R "$six" "$app/Contents/Resources/Six"
# The app replaces the Terminal start file.
rm -f "$app/Contents/Resources/Six/Start Six.command"

cat > "$app/Contents/MacOS/Six" <<'SCRIPT'
#!/bin/sh
# Starts Six in the background and opens it in the browser; quits right away (Six keeps running until it's quit from
# Settings, or a few minutes after its last tab closes).
cd "$(dirname "$0")/../Resources/Six"
nohup ./node/node web/launch.mjs >/dev/null 2>&1 &
SCRIPT
chmod 755 "$app/Contents/MacOS/Six"

cat > "$app/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Six</string>
  <key>CFBundleDisplayName</key><string>Six</string>
  <key>CFBundleIdentifier</key><string>io.github.cixmango.six</string>
  <key>CFBundleVersion</key><string>$version</string>
  <key>CFBundleShortVersionString</key><string>$version</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>Six</string>
  <key>CFBundleIconFile</key><string>six</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>LSArchitecturePriority</key><array><string>arm64</string></array>
</dict>
</plist>
PLIST

# The icon, from the 512 px mark.
icons="$work/six.iconset"
mkdir -p "$icons"
for size in 16 32 64 128 256 512; do
  sips -z $size $size "$brand/six-512.png" --out "$icons/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  [ $double -le 512 ] && sips -z $double $double "$brand/six-512.png" --out "$icons/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$icons" -o "$app/Contents/Resources/six.icns"

pkgbuild --root "$work/root" --install-location /Applications --identifier io.github.cixmango.six \
  --version "$version" "$work/Six-component.pkg"

mkdir -p "$work/resources"
cp "$here/../art/mac-background.png" "$work/resources/background.png"
cp "$six/LICENSE.txt" "$work/resources/License.txt"
cat > "$work/resources/Welcome.html" <<HTML
<html><body style="font-family:-apple-system,Helvetica;font-size:13px">
<h2 style="margin-top:0">Welcome to Six $version</h2>
<p>Hex tic-tac-toe with a self-trained bot. Six goes into the Applications folder in your home folder; no admin
password is needed.</p>
<p>Open Six from Launchpad or Applications. It opens in your browser and checks for updates each time it starts.</p>
</body></html>
HTML

cat > "$work/distribution.xml" <<XML
<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="2">
  <title>Six</title>
  <background file="background.png" alignment="bottomleft" scaling="none"/>
  <background-darkAqua file="background.png" alignment="bottomleft" scaling="none"/>
  <welcome file="Welcome.html"/>
  <license file="License.txt"/>
  <domains enable_anywhere="false" enable_currentUserHome="true" enable_localSystem="false"/>
  <options customize="never" require-scripts="false" hostArchitectures="arm64"/>
  <choices-outline><line choice="six"/></choices-outline>
  <choice id="six" title="Six"><pkg-ref id="io.github.cixmango.six"/></choice>
  <pkg-ref id="io.github.cixmango.six" version="$version">Six-component.pkg</pkg-ref>
</installer-gui-script>
XML

mkdir -p "$out"
productbuild --distribution "$work/distribution.xml" --resources "$work/resources" --package-path "$work" \
  "$out/Six-$version-Setup-macos.pkg"
echo "wrote $out/Six-$version-Setup-macos.pkg"
