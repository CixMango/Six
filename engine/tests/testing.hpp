#pragma once
// A minimal test harness: TEST_CASE registers a function, CHECK records failures.
#include <functional>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

namespace six::testing {

struct Case {
  const char* name;
  std::function<void()> body;
};

inline std::vector<Case>& registry() {
  static std::vector<Case> cases;
  return cases;
}

inline int& failures() {
  static int count = 0;
  return count;
}

struct Registrar {
  Registrar(const char* name, std::function<void()> body) { registry().push_back({name, std::move(body)}); }
};

inline void fail(const char* file, int line, const std::string& message) {
  ++failures();
  std::cerr << file << "(" << line << "): " << message << "\n";
}

}  // namespace six::testing

#define SIX_CONCAT_INNER(a, b) a##b
#define SIX_CONCAT(a, b) SIX_CONCAT_INNER(a, b)

#define TEST_CASE(name)                                                                       \
  static void SIX_CONCAT(test_fn_, __LINE__)();                                              \
  static ::six::testing::Registrar SIX_CONCAT(test_reg_, __LINE__)(name, SIX_CONCAT(test_fn_, __LINE__)); \
  static void SIX_CONCAT(test_fn_, __LINE__)()

#define CHECK(cond)                                                    \
  do {                                                                 \
    if (!(cond)) ::six::testing::fail(__FILE__, __LINE__, "CHECK(" #cond ") failed"); \
  } while (0)

#define CHECK_EQ(actual, expected)                                                  \
  do {                                                                              \
    const auto& six_a = (actual);                                                   \
    const auto& six_e = (expected);                                                 \
    if (!(six_a == six_e)) {                                                        \
      std::ostringstream six_os;                                                    \
      six_os << "CHECK_EQ(" #actual ", " #expected ") got " << six_a << ", expected " << six_e; \
      ::six::testing::fail(__FILE__, __LINE__, six_os.str());                       \
    }                                                                               \
  } while (0)
