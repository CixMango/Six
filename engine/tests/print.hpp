#pragma once
// Stream output for engine types, so CHECK_EQ can print them (found by argument-dependent lookup).
#include <ostream>

#include "board.hpp"

namespace six {

inline std::ostream& operator<<(std::ostream& os, Player p) { return os << toChar(p); }
inline std::ostream& operator<<(std::ostream& os, PlaceError e) { return os << "PlaceError(" << static_cast<int>(e) << ")"; }
inline std::ostream& operator<<(std::ostream& os, Hex h) { return os << "(" << h.q << ", " << h.r << ")"; }

}  // namespace six
