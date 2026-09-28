// Six.exe, the downloaded app's Windows launcher: runs node\node.exe web\launch.mjs with no window and exits.
// launch.mjs opens Six in the browser (starting it first if it isn't running).
#include <windows.h>

#include <string>

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int) {
  wchar_t self[MAX_PATH];
  const DWORD length = GetModuleFileNameW(nullptr, self, MAX_PATH);
  std::wstring dir(self, length);
  dir = dir.substr(0, dir.find_last_of(L"\\/"));
  const std::wstring node = dir + L"\\node\\node.exe";
  if (GetFileAttributesW(node.c_str()) == INVALID_FILE_ATTRIBUTES) {
    // Opened from inside the zip: Windows unpacks only this file, so nothing else is next to it.
    MessageBoxW(nullptr,
                L"Six can't find its files. This usually means it was opened from inside the zip.\n\n"
                L"Right-click the zip, choose \"Extract All...\", then open Six in the extracted folder.",
                L"Six", MB_OK | MB_ICONWARNING);
    return 1;
  }
  std::wstring command = L"\"" + node + L"\" \"" + dir + L"\\web\\launch.mjs\"";
  STARTUPINFOW startup{};
  startup.cb = sizeof(startup);
  PROCESS_INFORMATION process{};
  if (!CreateProcessW(nullptr, command.data(), nullptr, nullptr, FALSE, CREATE_NO_WINDOW, nullptr, dir.c_str(), &startup,
                      &process)) {
    MessageBoxW(nullptr, L"Six couldn't start its server.", L"Six", MB_OK | MB_ICONERROR);
    return 1;
  }
  CloseHandle(process.hThread);
  CloseHandle(process.hProcess);
  return 0;
}
