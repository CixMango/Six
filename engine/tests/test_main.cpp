#include <chrono>
#include <exception>
#include <string>

#include "testing.hpp"

// Usage: sixtests [substring]  runs only the tests whose names contain the substring.
int main(int argc, char** argv) {
  using namespace six::testing;
  const std::string filter = argc > 1 ? argv[1] : "";
  int ran = 0;
  for (const auto& c : registry()) {
    if (!filter.empty() && std::string(c.name).find(filter) == std::string::npos) continue;
    const int before = failures();
    const auto start = std::chrono::steady_clock::now();
    try {
      c.body();
    } catch (const std::exception& e) {
      fail(__FILE__, __LINE__, std::string("uncaught exception in \"") + c.name + "\": " + e.what());
    }
    const auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - start).count();
    std::cout << (failures() == before ? "  ok    " : "  FAIL  ") << c.name << "  (" << ms << " ms)" << std::endl;
    ++ran;
  }
  std::cout << ran << " tests, " << failures() << " failed checks" << std::endl;
  return failures() == 0 ? 0 : 1;
}
