"""Match statistics for game pairs played from the same opening with colors swapped.

Pentanomial counts: index k holds pairs where engine A scored k/2 points out of 2.
The log-likelihood ratio uses the normal approximation of the generalized SPRT used by
Fishtest and OpenBench.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

PAIR_SCORES = (0.0, 0.25, 0.5, 0.75, 1.0)


def elo_to_score(elo: float) -> float:
    return 1.0 / (1.0 + 10.0 ** (-elo / 400.0))


def score_to_elo(score: float) -> float:
    score = min(max(score, 1e-6), 1 - 1e-6)
    return -400.0 * math.log10(1.0 / score - 1.0)


def _moments(counts: list[float]) -> tuple[float, float, float]:
    n = sum(counts)
    if n == 0:
        return 0, 0.5, 0.0
    mean = sum(c * s for c, s in zip(counts, PAIR_SCORES)) / n
    var = sum(c * (s - mean) ** 2 for c, s in zip(counts, PAIR_SCORES)) / n
    return n, mean, var


def llr(counts: list[int], elo0: float, elo1: float) -> float:
    """Evidence for Elo difference elo1 over elo0 (positive favors elo1)."""
    if sum(counts) == 0:
        return 0.0
    # Half a pair of prior in every outcome keeps a handful of lopsided pairs, whose sample
    # variance is near zero, from looking like overwhelming evidence.
    n, mean, var = _moments([c + 0.5 for c in counts])
    s0 = elo_to_score(elo0)
    s1 = elo_to_score(elo1)
    return n * (s1 - s0) * (2 * mean - s0 - s1) / (2 * var)


def sprt_bounds(alpha: float = 0.05, beta: float = 0.05) -> tuple[float, float]:
    return math.log(beta / (1 - alpha)), math.log((1 - beta) / alpha)


@dataclass
class EloEstimate:
    elo: float
    low: float          # -inf when the games don't bound the difference from below
    high: float         # +inf when they don't bound it from above
    score: float

    @property
    def bounded(self) -> bool:
        return math.isfinite(self.low) and math.isfinite(self.high)


def elo_estimate(counts: list[int]) -> EloEstimate:
    """Elo of A over B with a 95% interval, from pair scores.

    A match every pair of which ended the same way (a sweep) has no sample variance, and its Elo is really only
    bounded on one side. Those get the same half-pair prior the SPRT uses, which gives an honest one-sided bound
    instead of an estimate pinned to the scale's end.
    """
    n, mean, var = _moments(counts)
    if n == 0:
        return EloEstimate(0.0, -math.inf, math.inf, 0.5)
    if var == 0.0:
        n, mean, var = _moments([c + 0.5 for c in counts])
    margin = 1.96 * math.sqrt(var / n)
    low, high = mean - margin, mean + margin
    return EloEstimate(score_to_elo(mean),
                       score_to_elo(low) if low > 0.0 else -math.inf,
                       score_to_elo(high) if high < 1.0 else math.inf,
                       mean)


def elo_json(value: float) -> float | None:
    """JSON has no infinity: an unbounded end of an interval is null."""
    return round(value, 1) if math.isfinite(value) else None
