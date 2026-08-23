#pragma once

// C++26 dense tensors for handbook operators (CPU, small-to-medium).
static_assert(__cplusplus >= 202400L, "abliterate-cxx requires ISO C++26 (-std=c++26 / /std:c++latest as C++26)");

#include <algorithm>
#include <charconv>
#include <cctype>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <expected>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <limits>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

namespace abliteration {

inline constexpr float kEps = 1e-8f;
inline constexpr std::size_t kMaxMatrixElements = 64U * 1024U * 1024U;
inline constexpr std::uintmax_t kMaxMatrixFileBytes = 512U * 1024U * 1024U;

[[nodiscard]] inline std::size_t checked_matrix_elements(std::size_t rows,
                                                         std::size_t cols) {
  if (rows == 0 || cols == 0) throw std::invalid_argument("matrix dimensions must be positive");
  if (rows > std::numeric_limits<std::size_t>::max() / cols)
    throw std::length_error("matrix dimensions overflow address space");
  const std::size_t elements = rows * cols;
  if (elements > kMaxMatrixElements)
    throw std::length_error("matrix exceeds the 64M-element text-lab limit");
  return elements;
}

struct Vec {
  std::vector<float> data;

  Vec() = default;
  explicit Vec(std::size_t n, float fill = 0.f) : data(n, fill) {}

  [[nodiscard]] std::size_t size() const noexcept { return data.size(); }
  float& operator[](std::size_t i) { return data.at(i); }
  float operator[](std::size_t i) const { return data.at(i); }
};

struct Mat {
  std::size_t rows{0};
  std::size_t cols{0};
  std::vector<float> data;  // row-major

  Mat() = default;
  Mat(std::size_t r, std::size_t c, float fill = 0.f)
      : rows(r), cols(c), data(checked_matrix_elements(r, c), fill) {}

  [[nodiscard]] float& operator()(std::size_t r, std::size_t c) {
    if (r >= rows || c >= cols) throw std::out_of_range("matrix index out of range");
    return data.at(r * cols + c);
  }
  [[nodiscard]] float operator()(std::size_t r, std::size_t c) const {
    if (r >= rows || c >= cols) throw std::out_of_range("matrix index out of range");
    return data.at(r * cols + c);
  }

  [[nodiscard]] Vec row(std::size_t r) const {
    Vec v(cols);
    for (std::size_t c = 0; c < cols; ++c) v[c] = (*this)(r, c);
    return v;
  }
};

[[nodiscard]] inline float dot(const Vec& a, const Vec& b) {
  if (a.size() != b.size()) throw std::invalid_argument("dot: size mismatch");
  double s = 0.0;
  for (std::size_t i = 0; i < a.size(); ++i) {
    if (!std::isfinite(a[i]) || !std::isfinite(b[i]))
      throw std::domain_error("dot: non-finite input");
    s += static_cast<double>(a[i]) * static_cast<double>(b[i]);
  }
  if (!std::isfinite(s) || std::abs(s) > std::numeric_limits<float>::max())
    throw std::overflow_error("dot: non-finite result");
  return static_cast<float>(s);
}

[[nodiscard]] inline float norm(const Vec& v) {
  return std::sqrt(dot(v, v));
}

[[nodiscard]] inline Vec unit(const Vec& v, float eps = kEps) {
  const float n = norm(v);
  if (!std::isfinite(n) || n <= eps)
    throw std::domain_error("unit: zero or non-finite vector");
  Vec o(v.size());
  for (std::size_t i = 0; i < v.size(); ++i) o[i] = v[i] / n;
  return o;
}

[[nodiscard]] inline Vec axpy(const Vec& a, float s, const Vec& b) {
  if (a.size() != b.size()) throw std::invalid_argument("axpy: size mismatch");
  if (!std::isfinite(s)) throw std::invalid_argument("axpy: non-finite scale");
  Vec o(a.size());
  for (std::size_t i = 0; i < a.size(); ++i) o[i] = a[i] + s * b[i];
  return o;
}

[[nodiscard]] inline Vec mean_rows(const Mat& m) {
  if (m.rows == 0) throw std::invalid_argument("mean_rows: empty");
  std::vector<double> sums(m.cols, 0.0);
  for (std::size_t r = 0; r < m.rows; ++r) {
    for (std::size_t c = 0; c < m.cols; ++c) {
      if (!std::isfinite(m(r, c))) throw std::domain_error("mean_rows: non-finite input");
      sums[c] += static_cast<double>(m(r, c));
    }
  }
  Vec mu(m.cols, 0.f);
  const double inv = 1.0 / static_cast<double>(m.rows);
  for (std::size_t c = 0; c < m.cols; ++c) {
    const double value = sums[c] * inv;
    if (!std::isfinite(value) || std::abs(value) > std::numeric_limits<float>::max())
      throw std::overflow_error("mean_rows: non-finite result");
    mu[c] = static_cast<float>(value);
  }
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
[[nodiscard]] inline std::expected<std::size_t, std::string> parse_positive_size(
    std::string_view token, std::string_view label) {
  if (token.empty() || token.front() == '-' || token.front() == '+')
    return std::unexpected(std::string("bad ") + std::string(label));
  std::uint64_t value = 0;
  const auto [ptr, ec] = std::from_chars(token.data(), token.data() + token.size(), value);
  if (ec != std::errc{} || ptr != token.data() + token.size() || value == 0 ||
      value > std::numeric_limits<std::size_t>::max())
    return std::unexpected(std::string("bad ") + std::string(label));
  return static_cast<std::size_t>(value);
}

[[nodiscard]] inline std::expected<std::string, std::string> read_bounded_token(
    std::istream& in, std::size_t maximum, std::string_view label) {
  in >> std::ws;
  std::string token;
  while (in) {
    const int next = in.peek();
    if (next == std::char_traits<char>::eof() ||
        std::isspace(static_cast<unsigned char>(next))) break;
    if (token.size() >= maximum)
      return std::unexpected(std::string(label) + " token is too long");
    token.push_back(static_cast<char>(in.get()));
  }
  if (token.empty()) return std::unexpected(std::string("missing ") + std::string(label));
  return token;
}

[[nodiscard]] inline std::expected<Mat, std::string> load_mat(std::string_view path) {
  const std::filesystem::path file{path};
  std::error_code file_ec;
  const auto bytes = std::filesystem::file_size(file, file_ec);
  if (!file_ec && bytes > kMaxMatrixFileBytes)
    return std::unexpected("matrix file exceeds the 512 MiB text-lab limit");
  std::ifstream in{std::string(path)};
  if (!in) return std::unexpected(std::string("cannot open ") + std::string(path));
  const auto rows_token = read_bounded_token(in, 32U, "matrix row count");
  const auto cols_token = read_bounded_token(in, 32U, "matrix column count");
  if (!rows_token || !cols_token)
    return std::unexpected(!rows_token ? rows_token.error() : cols_token.error());
  const auto rows = parse_positive_size(*rows_token, "matrix row count");
  const auto cols = parse_positive_size(*cols_token, "matrix column count");
  if (!rows || !cols) return std::unexpected(!rows ? rows.error() : cols.error());
  std::size_t elements = 0;
  try {
    elements = checked_matrix_elements(*rows, *cols);
  } catch (const std::exception& ex) {
    return std::unexpected(ex.what());
  }
  Mat m;
  try {
    m = Mat(*rows, *cols);
  } catch (const std::exception& ex) {
    return std::unexpected(std::string("cannot allocate matrix: ") + ex.what());
  }
  for (std::size_t i = 0; i < elements; ++i) {
    if (!(in >> m.data.at(i))) return std::unexpected("truncated or invalid matrix body");
    if (!std::isfinite(m.data.at(i))) return std::unexpected("matrix contains a non-finite value");
  }
  in >> std::ws;
  if (in.peek() != std::char_traits<char>::eof())
    return std::unexpected("matrix contains trailing data");
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
  try {
    if (m.data.size() != checked_matrix_elements(m.rows, m.cols))
      return std::unexpected("matrix shape does not match storage");
  } catch (const std::exception& ex) {
    return std::unexpected(ex.what());
  }
  for (const float value : m.data)
    if (!std::isfinite(value)) return std::unexpected("refusing to write non-finite matrix");
  std::ofstream out{std::string(path)};
  if (!out) return std::unexpected(std::string("cannot write ") + std::string(path));
  out << std::setprecision(std::numeric_limits<float>::max_digits10);
  out << m.rows << ' ' << m.cols << '\n';
  for (std::size_t r = 0; r < m.rows; ++r) {
    for (std::size_t c = 0; c < m.cols; ++c) {
      if (c) out << ' ';
      out << m(r, c);
    }
    out << '\n';
  }
  out.flush();
  if (!out) return std::unexpected(std::string("failed while writing ") + std::string(path));
  return {};
}

inline std::expected<void, std::string> save_vec(std::string_view path, const Vec& v) {
  if (v.size() == 0) return std::unexpected("refusing to write an empty vector");
  Mat m(1, v.size());
  m.data = v.data;
  return save_mat(path, m);
}

}  // namespace abliteration
