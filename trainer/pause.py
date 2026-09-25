"""Decides when training and self-play should pause, and suspends/resumes child processes.

Pause reasons:
- a fullscreen window that isn't a browser or media player (assumed to be a game),
- an app listed in `pauseApps` in runs/rl/config.json is running (e.g. obs64.exe),
- the pause file exists (written by the dashboard's pause button),
- the bot in Six played a turn in the last few minutes.
GPU encoder activity isn't used: replay buffers keep an encoder session open all the time.
"""
from __future__ import annotations

import ctypes
import json
import subprocess
import time
from ctypes import wintypes
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAUSE_FILE = ROOT / "runs" / "rl" / "PAUSE"
CONFIG_FILE = ROOT / "runs" / "rl" / "config.json"
# Six's server touches this file around every HexBot turn (web/src/server/training.ts, markBotGame).
BOT_GAME_FILE = ROOT / "runs" / "rl" / "six-bot-game"
BOT_GAME_SECONDS = 180  # a game counts as running this long after the bot's last turn
# Fullscreen windows of these programs are not games.
NOT_GAMES = {"opera.exe", "opera_gx.exe", "chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "vivaldi.exe",
             "vlc.exe", "mpc-hc64.exe", "mpc-be64.exe", "video.ui.exe", "spotify.exe", "discord.exe", "explorer.exe",
             "applicationframehost.exe",
             # Screenshot tools cover the screen while you pick a region.
             "lightshot.exe", "screenclippinghost.exe", "snippingtool.exe", "sharex.exe", "greenshot.exe"}

_user32 = ctypes.WinDLL("user32", use_last_error=True)
_kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
_ntdll = ctypes.WinDLL("ntdll")


class _MonitorInfo(ctypes.Structure):
    _fields_ = [("cbSize", wintypes.DWORD), ("rcMonitor", wintypes.RECT), ("rcWork", wintypes.RECT), ("dwFlags", wintypes.DWORD)]


_DESKTOP_CLASSES = {"Progman", "WorkerW", "Shell_TrayWnd", "Shell_SecondaryTrayWnd"}


def _process_name(hwnd) -> str:
    pid = wintypes.DWORD()
    _user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    handle = _kernel32.OpenProcess(0x1000, False, pid.value)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not handle:
        return ""
    try:
        buffer = ctypes.create_unicode_buffer(1024)
        size = wintypes.DWORD(1024)
        if _kernel32.QueryFullProcessImageNameW(handle, 0, buffer, ctypes.byref(size)):
            return Path(buffer.value).name.lower()
        return ""
    finally:
        _kernel32.CloseHandle(handle)


def fullscreen_window() -> str | None:
    """"program: title" of the foreground window if it covers its whole monitor, else None."""
    hwnd = _user32.GetForegroundWindow()
    if not hwnd:
        return None
    name = ctypes.create_unicode_buffer(256)
    _user32.GetClassNameW(hwnd, name, 256)
    if name.value in _DESKTOP_CLASSES:
        return None
    rect = wintypes.RECT()
    if not _user32.GetWindowRect(hwnd, ctypes.byref(rect)):
        return None
    monitor = _user32.MonitorFromWindow(hwnd, 2)  # MONITOR_DEFAULTTONEAREST
    info = _MonitorInfo()
    info.cbSize = ctypes.sizeof(_MonitorInfo)
    if not _user32.GetMonitorInfoW(monitor, ctypes.byref(info)):
        return None
    m = info.rcMonitor
    if rect.left <= m.left and rect.top <= m.top and rect.right >= m.right and rect.bottom >= m.bottom:
        title = ctypes.create_unicode_buffer(256)
        _user32.GetWindowTextW(hwnd, title, 256)
        return f"{_process_name(hwnd) or '?'}: {title.value or name.value}"
    return None


def fullscreen_game() -> str | None:
    window = fullscreen_window()
    if window and window.split(":", 1)[0] not in NOT_GAMES:
        return window
    return None


def chosen_apps_running() -> list[str]:
    try:
        wanted = {name.lower() for name in json.loads(CONFIG_FILE.read_text(encoding="utf-8-sig")).get("pauseApps", [])}
    except (OSError, ValueError):
        return []
    if not wanted:
        return []
    out = subprocess.run(["tasklist", "/fo", "csv", "/nh"], capture_output=True, text=True, creationflags=subprocess.CREATE_NO_WINDOW)
    running = {line.split(",")[0].strip('"').lower() for line in out.stdout.splitlines() if line}
    return sorted(wanted & running)


def six_bot_game() -> bool:
    try:
        return time.time() - BOT_GAME_FILE.stat().st_mtime < BOT_GAME_SECONDS
    except OSError:
        return False


def pause_reason() -> str | None:
    if PAUSE_FILE.exists():
        return "paused from the dashboard"
    if six_bot_game():
        return "a HexBot game in Six"
    game = fullscreen_game()
    if game:
        return f"fullscreen game: {game}"
    apps = chosen_apps_running()
    if apps:
        return "running: " + ", ".join(apps)
    return None


def wait_while_paused(log=print, poll: float = 5.0) -> None:
    """Blocks until nothing asks for a pause; logs when a pause starts and ends."""
    reason = pause_reason()
    if not reason:
        return
    log(f"pausing: {reason}")
    started = time.monotonic()
    while reason:
        time.sleep(poll)
        reason = pause_reason()
    log(f"resuming after {(time.monotonic() - started) / 60:.1f} min")


_PROCESS_SUSPEND_RESUME = 0x0800


def _process_call(pid: int, function) -> bool:
    handle = _kernel32.OpenProcess(_PROCESS_SUSPEND_RESUME, False, pid)
    if not handle:
        return False
    try:
        return function(handle) == 0
    finally:
        _kernel32.CloseHandle(handle)


class _ProcessEntry(ctypes.Structure):
    _fields_ = [("dwSize", wintypes.DWORD), ("cntUsage", wintypes.DWORD), ("th32ProcessID", wintypes.DWORD),
                ("th32DefaultHeapID", ctypes.c_size_t), ("th32ModuleID", wintypes.DWORD),
                ("cntThreads", wintypes.DWORD), ("th32ParentProcessID", wintypes.DWORD),
                ("pcPriClassBase", ctypes.c_long), ("dwFlags", wintypes.DWORD), ("szExeFile", ctypes.c_wchar * 260)]


_kernel32.CreateToolhelp32Snapshot.restype = wintypes.HANDLE


def process_tree(pid: int) -> list[int]:
    """`pid` and every process it started, and they started, and so on (parents before children)."""
    snapshot = _kernel32.CreateToolhelp32Snapshot(0x2, 0)  # TH32CS_SNAPPROCESS
    children: dict[int, list[int]] = {}
    try:
        entry = _ProcessEntry()
        entry.dwSize = ctypes.sizeof(_ProcessEntry)
        more = _kernel32.Process32FirstW(snapshot, ctypes.byref(entry))
        while more:
            if entry.th32ProcessID != entry.th32ParentProcessID:
                children.setdefault(entry.th32ParentProcessID, []).append(entry.th32ProcessID)
            more = _kernel32.Process32NextW(snapshot, ctypes.byref(entry))
    finally:
        _kernel32.CloseHandle(snapshot)
    tree, i = [pid], 0
    while i < len(tree):
        tree.extend(c for c in children.get(tree[i], []) if c not in tree)
        i += 1
    return tree


# The venv's python.exe is only a launcher: the real interpreter (and train.py's data workers) are its children,
# so these act on the whole process tree.
def suspend(pid: int) -> bool:
    return all([_process_call(p, _ntdll.NtSuspendProcess) for p in process_tree(pid)])


def resume(pid: int) -> bool:
    return all([_process_call(p, _ntdll.NtResumeProcess) for p in process_tree(pid)])


def kill_tree(pid: int) -> None:
    subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True,
                   creationflags=subprocess.CREATE_NO_WINDOW)


if __name__ == "__main__":
    print("fullscreen window:", fullscreen_window())
    print("fullscreen game:", fullscreen_game())
    print("pause reason:", pause_reason())
