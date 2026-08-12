#pragma once

// C++26 dense tensors for handbook operators (CPU, small-to-medium).
static_assert(__cplusplus >= 202400L, "abliterate-cxx requires ISO C++26 (-std=c++26 / /std:c++latest as C++26)");

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <expected>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

namespace abliteration {

inline constexpr float kEps = 1e-8f;

struct Vec {
  std::vector<float> data;

  Vec() = default;
  explicit Vec(std::size_t n, float fill = 0.f) : data(n, fill) {}

  [[nodiscard]] std::size_t size() const noexcept { return data.size(); }
  float& operator[](std::size_t i) { return data[i]; }
  float operator[](std::size_t i) const { return data[i]; }
};

struct Mat {
  std::size_t rows{0};
  std::size_t cols{0};
  std::vector<float> data;  // row-major

  Mat() = default;
  Mat(std::size_t r, std::size_t c, float fill = 0.f) : rows(r), cols(c), data(r * c, fill) {}

  [[nodiscard]] float& operator()(std::size_t r, std::size_t c) { return data[r * cols + c]; }
  [[nodiscard]] float operator()(std::size_t r, std::size_t c) const { return data[r * cols + c]; }

  [[nodiscard]] Vec row(std::size_t r) const {
    Vec v(cols);
    for (std::size_t c = 0; c < cols; ++c) v[c] = (*this)(r, c);
    return v;
  }
};

[[nodiscard]] inline float dot(const Vec& a, const Vec& b) {
  if (a.size() != b.size()) throw std::invalid_argument("dot: size mismatch");
  float s = 0.f;
  for (std::size_t i = 0; i < a.size(); ++i) s += a[i] * b[i];
  return s;
}

[[nodiscard]] inline float norm(const Vec& v) {
  return std::sqrt(dot(v, v));
}

[[nodiscard]] inline Vec unit(const Vec& v, float eps = kEps) {
  const float n = std::max(norm(v), eps);
  Vec o(v.size());
  for (std::size_t i = 0; i < v.size(); ++i) o[i] = v[i] / n;
  return o;
}

[[nodiscard]] inline Vec axpy(const Vec& a, float s, const Vec& b) {
  Vec o(a.size());
  for (std::size_t i = 0; i < a.size(); ++i) o[i] = a[i] + s * b[i];
  return o;
}

[[nodiscard]] inline Vec mean_rows(const Mat& m) {
  if (m.rows == 0) throw std::invalid_argument("mean_rows: empty");
  Vec mu(m.cols, 0.f);
  for (std::size_t r = 0; r < m.rows; ++r)
    for (std::size_t c = 0; c < m.cols; ++c) mu[c] += m(r, c);
  const float inv = 1.f / static_cast<float>(m.rows);
  for (std::size_t c = 0; c < m.cols; ++c) mu[c] *= inv;
  return mu;
}

[[nodiscard]] inline float vec_mat_row_dot(const Mat& m, std::size_t row, const Vec& v) {
  if (v.size() != m.cols) throw std::invalid_argument("row-dot cols");
  float s = 0.f;
  for (std::size_t c = 0; c < m.cols; ++c) s += m(row, c) * v[c];
  return s;
}

// W^T r for W [d_out, d_in], r [d_out] → [d_in]
[[nodiscard]] inline Vec mat_t_vec(const Mat& w, const Vec& r) {
  if (r.size() != w.rows) throw std::invalid_argument("mat_t_vec: r dim != W rows");
  Vec out(w.cols, 0.f);
  for (std::size_t j = 0; j < w.cols; ++j)
    for (std::size_t i = 0; i < w.rows; ++i) out[j] += w(i, j) * r[i];
  return out;
}

[[nodiscard]] inline Vec mat_vec(const Mat& w, const Vec& x) {
  if (x.size() != w.cols) throw std::invalid_argument("mat_vec: x dim != W cols");
  Vec out(w.rows, 0.f);
  for (std::size_t i = 0; i < w.rows; ++i)
    for (std::size_t j = 0; j < w.cols; ++j) out[i] += w(i, j) * x[j];
  return out;
}

// Text matrix: first line "rows cols", then row-major floats.
[[nodiscard]] inline std::expected<Mat, std::string> load_mat(std::string_view path) {
  std::ifstream in{std::string(path)};
  if (!in) return std::unexpected(std::string("cannot open ") + std::string(path));
  std::size_t rows = 0, cols = 0;
  if (!(in >> rows >> cols) || rows == 0 || cols == 0)
    return std::unexpected("bad matrix header (want: rows cols)");
  Mat m(rows, cols);
  for (std::size_t i = 0; i < rows * cols; ++i) {
    if (!(in >> m.data[i])) return std::unexpected("truncated matrix body");
  }
  return m;
}

[[nodiscard]] inline std::expected<Vec, std::string> load_vec(std::string_view path) {
  auto m = load_mat(path);
  if (!m) return std::unexpected(m.error());
  if (m->rows == 1) {
    Vec v(m->cols);
    v.data = m->data;
    return v;
  }
  if (m->cols == 1) {
    Vec v(m->rows);
    v.data = m->data;
    return v;
  }
  // treat first row as the vector if it is a direction dump [1,d] already handled
  return std::unexpected("vector file must be 1 x d or d x 1");
}

inline std::expected<void, std::string> save_mat(std::string_view path, const Mat& m) {
  std::ofstream out{std::string(path)};
  if (!out) return std::unexpected(std::string("cannot write ") + std::string(path));
  out << m.rows << ' ' << m.cols << '\n';
  for (std::size_t r = 0; r < m.rows; ++r) {
    for (std::size_t c = 0; c < m.cols; ++c) {
      if (c) out << ' ';
      out << m(r, c);
    }
    out << '\n';
  }
  return {};
}

inline std::expected<void, std::string> save_vec(std::string_view path, const Vec& v) {
  Mat m(1, v.size());
  m.data = v.data;
  return save_mat(path, m);
}

}  // namespace abliteration
