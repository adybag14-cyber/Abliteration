#include "abliteration/eval.hpp"
#include "abliteration/ops.hpp"
#include "abliteration/paths.hpp"
#include "abliteration/self_check.hpp"

#include <cmath>
#include <cstdlib>
#include <filesystem>
#include <iostream>
#include <stdexcept>
#include <string>

namespace {

int fails = 0;

void expect(bool cond, const char* msg) {
  if (!cond) {
    std::cerr << "FAIL " << msg << '\n';
    ++fails;
  }
}

void test_self_check_shared() {
  const auto r = abliteration::run_self_check();
  expect(r.ok, "shared self-check");
  if (!r.ok) std::cerr << "  reason: " << r.fail << '\n';
  expect(r.dim_align >= 0.8f, "dim_align >= 0.8");
  expect(r.hook_first == 0.f || std::abs(r.hook_first) < 1e-6f, "hook first component");
  expect(r.eval_n == 3 && r.eval_false_refusal == 1 && r.eval_true_hits == 1, "eval fixture");
}

void test_generated_dim() {
  // Plant e0 in a fresh cloud; estimate must recover it. No hardcoded r oracle.
  abliteration::Rng rng{99};
  constexpr int d = 24, n = 50;
  abliteration::Mat bad(n, d), good(n, d);
  for (int i = 0; i < n; ++i)
    for (int j = 0; j < d; ++j) {
      bad(i, j) = rng.normal() + (j == 3 ? 3.f : 0.f);
      good(i, j) = rng.normal();
    }
  const auto r = abliteration::mean_difference(bad, good);
  abliteration::Vec planted(d, 0.f);
  planted[3] = 1.f;
  const float align = std::abs(abliteration::dot(r, planted));
  expect(align > 0.85f, "generated DIM recovers planted axis 3");
  if (align <= 0.85f) std::cerr << "  align=" << align << '\n';

  const float cosmic = abliteration::cosmic_layer_score(bad, good);
  expect(cosmic > 0.f, "cosmic positive on planted contrast");

  const auto proj = abliteration::projected_direction(bad, good);
  expect(std::abs(abliteration::norm(proj) - 1.f) < 1e-5f, "projected unit");
}

void test_projection_kills_r() {
  abliteration::Rng rng{7};
  constexpr int d_out = 12, d_in = 20;
  abliteration::Mat w(d_out, d_in);
  for (int i = 0; i < d_out; ++i)
    for (int j = 0; j < d_in; ++j) w(i, j) = rng.normal();
  abliteration::Vec r(d_out);
  for (int i = 0; i < d_out; ++i) r[i] = rng.normal();
  r = abliteration::unit(r);
  const auto w2 = abliteration::apply_output_projection(w, r, 1.f);
  // r^T W' should be ~0
  float resid = 0.f;
  for (int j = 0; j < d_in; ++j) {
    float col = 0.f;
    for (int i = 0; i < d_out; ++i) col += r[i] * w2(i, j);
    resid += col * col;
  }
  resid = std::sqrt(resid);
  expect(resid < 1e-4f, "r^T W' ~ 0 after full wipe");
  if (resid >= 1e-4f) std::cerr << "  resid=" << resid << '\n';

  const auto hh = abliteration::apply_householder(w, r);
  float flip = 0.f;
  for (int j = 0; j < d_in; ++j) {
    float a = 0.f, b = 0.f;
    for (int i = 0; i < d_out; ++i) {
      a += r[i] * hh(i, j);
      b += r[i] * w(i, j);
    }
    const float e = a + b;
    flip += e * e;
  }
  expect(std::sqrt(flip) < 1e-4f, "Householder reflects r component");
}

void test_hook_property() {
  abliteration::Vec h(8);
  abliteration::Vec r(8);
  abliteration::Rng rng{3};
  for (int i = 0; i < 8; ++i) {
    h[i] = rng.normal();
    r[i] = rng.normal();
  }
  r = abliteration::unit(r);
  const auto hp = abliteration::inference_ablate(h, r, 1.f);
  expect(std::abs(abliteration::dot(hp, r)) < 1e-5f, "hook: h' ⊥ r");
  // orthogonal complement preserved
  abliteration::Vec q = h;
  const float d = abliteration::dot(h, r);
  for (int i = 0; i < 8; ++i) q[i] -= d * r[i];
  float err = 0.f;
  for (int i = 0; i < 8; ++i) {
    const float e = hp[i] - q[i];
    err += e * e;
  }
  expect(std::sqrt(err) < 1e-5f, "hook matches h - (h·r)r");
}

void test_eval_generated() {
  // Mix comply / refuse strings; counts must come from is_refusal on those strings.
  std::vector<abliteration::EvalRecord> recs;
  recs.push_back({"Sure, listing USB devices now.", "tool_call"});
  recs.push_back({"I cannot help with that request.", "tool_call"});
  recs.push_back({"Here is the nmap plan.", "comply"});
  recs.push_back({"I will not assist with that.", "refuse"});
  recs.push_back({"As an AI I must refuse.", "harmful"});
  const auto s = abliteration::score_records(recs);
  expect(s.n == 5, "eval n");
  expect(s.refusals == 3, "eval refusals");
  expect(s.false_refusal == 1, "one false refuse on tool_call");
  expect(s.true_refusal_hits == 2, "two true refuse hits");
}

void test_svd_refuses_large_d() {
  abliteration::Mat bad(2, 513, 0.1f);
  abliteration::Mat good(2, 513, 0.f);
  bool threw = false;
  try {
    (void)abliteration::svd_directions(bad, good, 2);
  } catch (const std::invalid_argument& ex) {
    threw = std::string(ex.what()).find("too large") != std::string::npos;
  }
  expect(threw, "svd d=513 throws too large");
}

void test_eval_empty_is_not_safety() {
  std::vector<abliteration::EvalRecord> recs;
  recs.push_back({"", "refuse"});
  recs.push_back({"   ", "harmful"});
  recs.push_back({"...", "bad"});
  recs.push_back({"I cannot help with that.", "refuse"});
  recs.push_back({"Sure, listing USB devices now.", "allow_tool"});
  const auto s = abliteration::score_records(recs);
  expect(s.n == 5, "empty-eval n");
  expect(s.empty_response == 2, "blank + whitespace empty");
  expect(s.degenerate == 3, "empty + dots degenerate");
  expect(s.true_refusal_hits == 1, "mute is not a true-refusal hit");
  expect(s.false_refusal == 0, "comply row was not refused");
}

void test_resolve_eval_jsonl_via_examples() {
  namespace fs = std::filesystem;
  const auto here = fs::current_path();
  std::error_code ec;
  const auto tmp = fs::temp_directory_path() / "abliterate-ops-eval-cwd";
  fs::create_directories(tmp, ec);
  if (ec) {
    std::cerr << "note: cannot mkdir for resolve_eval_jsonl test\n";
    return;
  }
  fs::current_path(tmp, ec);
  if (ec) {
    std::cerr << "note: cannot chdir for resolve_eval_jsonl test\n";
    return;
  }
  const auto ex = abliteration::find_examples_dir();
  const auto resolved = abliteration::resolve_eval_jsonl("generations.jsonl");
  fs::current_path(here, ec);
  if (ex.empty()) {
    std::cerr << "note: examples/ not next to exe — skip resolve_eval_jsonl\n";
    return;
  }
  expect(resolved.is_absolute(), "resolve_eval_jsonl returns absolute");
  expect(resolved.filename() == "generations.jsonl", "resolve_eval_jsonl filename");
  expect(fs::exists(resolved), "resolve_eval_jsonl finds generations.jsonl from a foreign cwd");
  expect(fs::equivalent(resolved, ex / "generations.jsonl", ec),
         "resolve_eval_jsonl uses find_examples_dir");
}

void test_find_examples_dir_via_exe() {
  namespace fs = std::filesystem;
  const auto here = fs::current_path();
  std::error_code ec;
  const auto tmp = fs::temp_directory_path() / "abliterate-ops-cwd";
  fs::create_directories(tmp, ec);
  if (ec) {
    std::cerr << "note: cannot mkdir for find_examples_dir test\n";
    return;
  }
  fs::current_path(tmp, ec);
  if (ec) {
    std::cerr << "note: cannot chdir for find_examples_dir test\n";
    return;
  }
  const auto ex = abliteration::find_examples_dir();
  fs::current_path(here, ec);
  if (ex.empty()) {
    std::cerr << "note: examples/ not next to exe — skip find_examples_dir\n";
    return;
  }
  expect(fs::exists(ex / "tiny-bad.txt"), "find_examples_dir works from a foreign cwd");
}

void test_shipped_examples() {
  const auto ex = abliteration::find_examples_dir();
  if (ex.empty()) {
    std::cerr << "note: examples/ not on this cwd — skip shipped-example load\n";
    return;
  }
  auto bad = abliteration::load_mat((ex / "tiny-bad.txt").string());
  auto good = abliteration::load_mat((ex / "tiny-good.txt").string());
  expect(bad.has_value() && good.has_value(), "load shipped tiny-bad/good");
  if (!bad || !good) return;
  const auto r = abliteration::mean_difference(*bad, *good);
  expect(r.size() == 4, "toy residual dim 4");
  expect(abliteration::cosmic_layer_score(*bad, *good) > 0.f, "toys separate");
  const auto recs = abliteration::load_jsonl((ex / "generations.jsonl").string());
  const auto s = abliteration::score_records(recs);
  expect(s.n == 5 && s.false_refusal == 1 && s.true_refusal_hits == 2, "toy jsonl scores");
}

void test_json_field() {
  const auto line =
      R"({"response":"I cannot help with that.","expected":"tool_call"})";
  expect(abliteration::json_string_field(line, "response") == "I cannot help with that.",
         "json response field");
  expect(abliteration::json_string_field(line, "expected") == "tool_call", "json expected field");
}

}  // namespace

int main(int argc, char** argv) {
  if (argc > 0) abliteration::set_argv0(argv[0]);
  test_self_check_shared();
  test_generated_dim();
  test_projection_kills_r();
  test_hook_property();
  test_eval_generated();
  test_svd_refuses_large_d();
  test_eval_empty_is_not_safety();
  test_json_field();
  test_find_examples_dir_via_exe();
  test_resolve_eval_jsonl_via_examples();
  test_shipped_examples();
  if (fails) {
    std::cerr << fails << " test(s) failed\n";
    return 1;
  }
  std::cout << "ok 10 suites (self-check + generated + empty-eval + shipped examples + exe paths + resolve_eval_jsonl)\n";
  return 0;
}
