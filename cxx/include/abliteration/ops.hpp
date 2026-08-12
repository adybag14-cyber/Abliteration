#pragma once

#include "abliteration/tensor.hpp"

#include <algorithm>
#include <cmath>
#include <numeric>
#include <string>
#include <utility>
#include <vector>

namespace abliteration {

// r = normalize(mean(H_bad) − mean(H_good))  — subtract then normalize (Lai 2026)
[[nodiscard]] inline Vec mean_difference(const Mat& h_bad, const Mat& h_good) {
  if (h_bad.cols != h_good.cols) throw std::invalid_argument("mean_difference: dim mismatch");
  const Vec mb = mean_rows(h_bad);
  const Vec mg = mean_rows(h_good);
  Vec r(mb.size());
  for (std::size_t i = 0; i < r.size(); ++i) r[i] = mb[i] - mg[i];
  return unit(r);
}

// Gram–Schmidt r off g; default two passes (Horning “twice is enough”)
[[nodiscard]] inline Vec project_off(Vec r, Vec g, int passes = 2) {
  g = unit(g);
  for (int p = 0; p < passes; ++p) {
    const float d = dot(r, g);
    for (std::size_t i = 0; i < r.size(); ++i) r[i] -= d * g[i];
  }
  return unit(r);
}

[[nodiscard]] inline Vec projected_direction(const Mat& h_bad, const Mat& h_good) {
  const Vec r = mean_difference(h_bad, h_good);
  const Vec g = unit(mean_rows(h_good));
  return project_off(r, g);
}

[[nodiscard]] inline float cosmic_layer_score(const Mat& h_bad, const Mat& h_good) {
  const Vec r = mean_difference(h_bad, h_good);
  float sb = 0.f, sg = 0.f;
  for (std::size_t i = 0; i < h_bad.rows; ++i) sb += vec_mat_row_dot(h_bad, i, r);
  for (std::size_t i = 0; i < h_good.rows; ++i) sg += vec_mat_row_dot(h_good, i, r);
  return (sb / static_cast<float>(h_bad.rows)) - (sg / static_cast<float>(h_good.rows));
}

// Jacobi eigen-decomposition of symmetric A (in/out). V starts as I, becomes eigenvectors.
inline void jacobi_eigen_symmetric(Mat& a, Mat& v, int max_sweeps = 64) {
  const std::size_t n = a.rows;
  if (a.rows != a.cols) throw std::invalid_argument("jacobi: not square");
  v = Mat(n, n, 0.f);
  for (std::size_t i = 0; i < n; ++i) v(i, i) = 1.f;
  for (int sweep = 0; sweep < max_sweeps; ++sweep) {
    float off = 0.f;
    for (std::size_t i = 0; i < n; ++i)
      for (std::size_t j = i + 1; j < n; ++j) off += std::abs(a(i, j));
    if (off < 1e-10f) break;
    for (std::size_t p = 0; p < n; ++p) {
      for (std::size_t q = p + 1; q < n; ++q) {
        const float apq = a(p, q);
        if (std::abs(apq) < 1e-12f) continue;
        const float app = a(p, p);
        const float aqq = a(q, q);
        const float tau = (aqq - app) / (2.f * apq);
        const float t = (tau >= 0.f ? 1.f : -1.f) / (std::abs(tau) + std::sqrt(1.f + tau * tau));
        const float c = 1.f / std::sqrt(1.f + t * t);
        const float s = t * c;
        for (std::size_t k = 0; k < n; ++k) {
          if (k != p && k != q) {
            const float akp = a(k, p);
            const float akq = a(k, q);
            a(k, p) = a(p, k) = c * akp - s * akq;
            a(k, q) = a(q, k) = s * akp + c * akq;
          }
        }
        a(p, p) = c * c * app - 2.f * s * c * apq + s * s * aqq;
        a(q, q) = s * s * app + 2.f * s * c * apq + c * c * aqq;
        a(p, q) = a(q, p) = 0.f;
        for (std::size_t k = 0; k < n; ++k) {
          const float vkp = v(k, p);
          const float vkq = v(k, q);
          v(k, p) = c * vkp - s * vkq;
          v(k, q) = s * vkp + c * vkq;
        }
      }
    }
  }
}

// Top-k right singular vectors of (H_bad − mean_good), shape [k, d]
[[nodiscard]] inline Mat svd_directions(const Mat& h_bad, const Mat& h_good, int rank) {
  if (h_bad.cols != h_good.cols) throw std::invalid_argument("svd: dim mismatch");
  const Vec mg = mean_rows(h_good);
  const std::size_t n = h_bad.rows;
  const std::size_t d = h_bad.cols;
  Mat delta(n, d);
  for (std::size_t i = 0; i < n; ++i)
    for (std::size_t j = 0; j < d; ++j) delta(i, j) = h_bad(i, j) - mg[j];

  // C = delta^T delta  [d,d]
  Mat c(d, d, 0.f);
  for (std::size_t i = 0; i < d; ++i)
    for (std::size_t j = i; j < d; ++j) {
      float s = 0.f;
      for (std::size_t r = 0; r < n; ++r) s += delta(r, i) * delta(r, j);
      c(i, j) = c(j, i) = s;
    }
  Mat ev;
  jacobi_eigen_symmetric(c, ev);
  std::vector<std::pair<float, std::size_t>> order;
  order.reserve(d);
  for (std::size_t i = 0; i < d; ++i) order.emplace_back(c(i, i), i);
  std::ranges::sort(order, [](const auto& a, const auto& b) { return a.first > b.first; });
  const int k = std::min(rank, static_cast<int>(d));
  Mat vh(static_cast<std::size_t>(k), d);
  for (int t = 0; t < k; ++t) {
    const std::size_t col = order[static_cast<std::size_t>(t)].second;
    Vec row(d);
    for (std::size_t i = 0; i < d; ++i) row[i] = ev(i, col);
    row = unit(row);
    for (std::size_t i = 0; i < d; ++i) vh(static_cast<std::size_t>(t), i) = row[i];
  }
  return vh;
}

// W' = (I − α r rᵀ) W     r in output dim (W rows)
[[nodiscard]] inline Mat apply_output_projection(const Mat& w, Vec r, float alpha = 1.f) {
  r = unit(r);
  if (r.size() != w.rows) throw std::invalid_argument("apply: r dim != W out");
  const Vec wt_r = mat_t_vec(w, r);
  Mat out = w;
  for (std::size_t i = 0; i < w.rows; ++i)
    for (std::size_t j = 0; j < w.cols; ++j) out(i, j) -= alpha * r[i] * wt_r[j];
  return out;
}

[[nodiscard]] inline Mat apply_householder(const Mat& w, const Vec& u) {
  return apply_output_projection(w, u, 2.f);
}

// Modified Gram–Schmidt on columns of A [m, k] → Q [m, k] with orthonormal columns
[[nodiscard]] inline Mat qr_thin_columns(Mat a) {
  const std::size_t m = a.rows;
  const std::size_t k = a.cols;
  for (std::size_t j = 0; j < k; ++j) {
    for (std::size_t i = 0; i < j; ++i) {
      float d = 0.f;
      for (std::size_t r = 0; r < m; ++r) d += a(r, i) * a(r, j);
      for (std::size_t r = 0; r < m; ++r) a(r, j) -= d * a(r, i);
    }
    float n = 0.f;
    for (std::size_t r = 0; r < m; ++r) n += a(r, j) * a(r, j);
    n = std::sqrt(std::max(n, kEps));
    for (std::size_t r = 0; r < m; ++r) a(r, j) /= n;
  }
  return a;
}

// W' = (I − α R Rᵀ) W. r_basis is [k, d_out]
[[nodiscard]] inline Mat apply_subspace(const Mat& w, const Mat& r_basis, float alpha = 1.f) {
  if (r_basis.rows == 1 || (r_basis.cols == w.rows && r_basis.rows == 1)) {
    Vec r(r_basis.cols);
    r.data = r_basis.data;
    if (r.size() != w.rows && r_basis.rows == w.rows && r_basis.cols == 1) {
      r = Vec(w.rows);
      r.data = r_basis.data;
    }
    if (r.size() == w.rows) return apply_output_projection(w, r, alpha);
  }
  if (r_basis.cols != w.rows)
    throw std::invalid_argument("subspace: R last dim != W out");
  // R is [k, d_out]; columns of R^T are [d_out, k]
  Mat rt(w.rows, r_basis.rows);
  for (std::size_t i = 0; i < r_basis.rows; ++i)
    for (std::size_t j = 0; j < r_basis.cols; ++j) rt(j, i) = r_basis(i, j);
  const Mat q = qr_thin_columns(rt);  // [d_out, k]
  // q^T W : [k, d_in]
  Mat qt_w(q.cols, w.cols, 0.f);
  for (std::size_t t = 0; t < q.cols; ++t)
    for (std::size_t j = 0; j < w.cols; ++j)
      for (std::size_t i = 0; i < w.rows; ++i) qt_w(t, j) += q(i, t) * w(i, j);
  Mat out = w;
  for (std::size_t i = 0; i < w.rows; ++i)
    for (std::size_t j = 0; j < w.cols; ++j) {
      float s = 0.f;
      for (std::size_t t = 0; t < q.cols; ++t) s += q(i, t) * qt_w(t, j);
      out(i, j) -= alpha * s;
    }
  return out;
}

enum class BakeMode { Arditi, Projected, OrbaDirectional, OrbaHouseholder, Subspace };

[[nodiscard]] inline BakeMode parse_bake_mode(std::string_view s) {
  if (s == "arditi") return BakeMode::Arditi;
  if (s == "projected") return BakeMode::Projected;
  if (s == "orba-directional") return BakeMode::OrbaDirectional;
  if (s == "orba-householder") return BakeMode::OrbaHouseholder;
  if (s == "subspace") return BakeMode::Subspace;
  throw std::invalid_argument("unknown bake mode");
}

[[nodiscard]] inline Mat apply_mode(const Mat& w, const Mat& r, BakeMode mode, float alpha = 1.f) {
  switch (mode) {
    case BakeMode::Arditi:
    case BakeMode::Projected:
    case BakeMode::OrbaDirectional: {
      Vec v(r.cols == w.rows ? r.cols : r.rows);
      if (r.rows == 1 && r.cols == w.rows) {
        v.data = r.data;
      } else if (r.cols == 1 && r.rows == w.rows) {
        v.data = r.data;
      } else if (r.cols == w.rows) {
        // first row of a [k,d] basis
        for (std::size_t i = 0; i < w.rows; ++i) v[i] = r(0, i);
      } else {
        throw std::invalid_argument("apply_mode: r shape");
      }
      return apply_output_projection(w, v, alpha);
    }
    case BakeMode::OrbaHouseholder: {
      Vec v(w.rows);
      if (r.rows == 1) v.data = r.data;
      else if (r.cols == 1) v.data = r.data;
      else
        for (std::size_t i = 0; i < w.rows; ++i) v[i] = r(0, i);
      return apply_householder(w, v);
    }
    case BakeMode::Subspace:
      if (r.rows == 1) {
        Vec v(r.cols);
        v.data = r.data;
        return apply_output_projection(w, v, alpha);
      }
      return apply_subspace(w, r, alpha);
  }
  throw std::invalid_argument("apply_mode");
}

// h' = h − α (h·r) r
[[nodiscard]] inline Vec inference_ablate(const Vec& h, Vec r, float alpha = 1.f) {
  r = unit(r);
  if (h.size() != r.size()) throw std::invalid_argument("hook: dim mismatch");
  const float d = dot(h, r);
  Vec o(h.size());
  for (std::size_t i = 0; i < h.size(); ++i) o[i] = h[i] - alpha * d * r[i];
  return o;
}

[[nodiscard]] inline Mat inference_ablate_batch(const Mat& h, const Vec& r, float alpha = 1.f) {
  Mat o = h;
  for (std::size_t i = 0; i < h.rows; ++i) {
    const Vec row = inference_ablate(h.row(i), r, alpha);
    for (std::size_t c = 0; c < h.cols; ++c) o(i, c) = row[c];
  }
  return o;
}

}  // namespace abliteration
