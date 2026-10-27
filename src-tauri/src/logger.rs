//! Shell-side logging (`shell.log`), diagnostics bundle and GitHub issue link.
//!
//! Logging is strictly best-effort: every failure is swallowed — a broken log
//! must never take the app down. Pure helpers are unit-tested in-module.

use std::io::{Read, Seek, SeekFrom, Write};
use std::path::Path;
use std::time::SystemTime;

pub const APP_REPO: &str = "NoelOrin/resume-studio";

const MAX_LOG_BYTES: u64 = 1 << 20;
const TAIL_LINES: usize = 100;
const TAIL_WINDOW: u64 = 256 * 1024;

pub fn now_rfc3339() -> String {
    humantime::format_rfc3339_seconds(SystemTime::now()).to_string()
}

/// Local calendar day (UTC) as `YYYY-MM-DD`, for per-day notification throttling.
pub fn today() -> String {
    now_rfc3339().get(..10).unwrap_or("").to_string()
}

pub fn needs_rotation(len: u64) -> bool {
    len >= MAX_LOG_BYTES
}

/// Append one line to `<dir>/shell.log`, rotating to `shell.log.1` past 1 MB.
pub fn log(dir: &Path, level: &str, msg: &str) {
    let _ = std::fs::create_dir_all(dir);
    let path = dir.join("shell.log");
    if let Ok(meta) = std::fs::metadata(&path) {
        if needs_rotation(meta.len()) {
            let _ = std::fs::rename(&path, dir.join("shell.log.1"));
        }
    }
    let line = format!("{} [{level}] {msg}\n", now_rfc3339());
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(&path) {
        let _ = file.write_all(line.as_bytes());
    }
}

/// Last `max_lines` lines of a file. For files past `TAIL_WINDOW` bytes, seeks
/// to the tail window and drops the (likely partial) first line.
pub fn read_tail(path: &Path, max_lines: usize) -> String {
    let missing = || "（无）".to_string();
    let Ok(meta) = std::fs::metadata(path) else {
        return missing();
    };
    let Ok(mut file) = std::fs::File::open(path) else {
        return missing();
    };
    let start = meta.len().saturating_sub(TAIL_WINDOW);
    if start > 0 && file.seek(SeekFrom::Start(start)).is_err() {
        return "（读取失败）".to_string();
    }
    let mut buf = Vec::new();
    if file.read_to_end(&mut buf).is_err() {
        return "（读取失败）".to_string();
    }
    let mut text = String::from_utf8_lossy(&buf).to_string();
    if start > 0 {
        if let Some(pos) = text.find('\n') {
            text.drain(..=pos);
        }
    }
    let lines: Vec<&str> = text.lines().collect();
    let skip = lines.len().saturating_sub(max_lines);
    lines[skip..].join("\n")
}

/// Char-boundary-safe truncation (`…` suffix when cut).
pub fn truncate(s: &str, max_chars: usize) -> String {
    if s.chars().count() <= max_chars {
        return s.to_string();
    }
    let cut: String = s.chars().take(max_chars).collect();
    format!("{cut}…")
}

pub fn build_diagnostics(data_dir: &Path, version: &str) -> String {
    format!(
        "Resume Studio 诊断信息\n\
         版本: {version} (desktop)\n\
         系统: {} {}\n\
         时间: {}\n\
         数据目录: {}\n\
         （发送前请确认以下日志不含敏感内容）\n\
         \n--- shell.log（尾部）---\n{}\n\
         \n--- server.log（尾部）---\n{}",
        std::env::consts::OS,
        std::env::consts::ARCH,
        now_rfc3339(),
        data_dir.display(),
        read_tail(&data_dir.join("shell.log"), TAIL_LINES),
        read_tail(&data_dir.join("server.log"), TAIL_LINES),
    )
}

/// GitHub new-issue URL with title/body percent-encoded (form style).
pub fn issue_url(repo: &str, version: &str, body: &str) -> String {
    use url::form_urlencoded;
    let query = form_urlencoded::Serializer::new(String::new())
        .append_pair("title", &format!("问题反馈 · Resume Studio v{version}"))
        .append_pair("body", body)
        .finish();
    format!("https://github.com/{repo}/issues/new?{query}")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(tag: &str) -> std::path::PathBuf {
        use std::sync::atomic::{AtomicU32, Ordering};
        static COUNTER: AtomicU32 = AtomicU32::new(0);
        let dir = std::env::temp_dir().join(format!(
            "rs-logger-{}-{}-{}",
            tag,
            std::process::id(),
            COUNTER.fetch_add(1, Ordering::SeqCst)
        ));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn rotation_threshold() {
        assert!(!needs_rotation(0));
        assert!(!needs_rotation(MAX_LOG_BYTES - 1));
        assert!(needs_rotation(MAX_LOG_BYTES));
    }

    #[test]
    fn log_appends_and_rotates() {
        let dir = temp_dir("rotate");
        log(&dir, "info", "first");
        log(&dir, "warn", "second");
        let content = std::fs::read_to_string(dir.join("shell.log")).unwrap();
        assert_eq!(content.lines().count(), 2);
        assert!(content.contains("[info] first"));
        assert!(content.contains("[warn] second"));
        // Force rotation by pre-sizing shell.log, then verify the old file moved.
        std::fs::write(dir.join("shell.log"), vec![b'x'; MAX_LOG_BYTES as usize]).unwrap();
        log(&dir, "info", "after rotate");
        assert_eq!(
            std::fs::read(dir.join("shell.log.1")).unwrap().len() as u64,
            MAX_LOG_BYTES
        );
        let fresh = std::fs::read_to_string(dir.join("shell.log")).unwrap();
        assert!(fresh.contains("after rotate"));
    }

    #[test]
    fn read_tail_returns_last_lines_only() {
        let dir = temp_dir("tail");
        let path = dir.join("sample.log");
        let body: String = (0..300).map(|i| format!("line-{i}\n")).collect();
        std::fs::write(&path, &body).unwrap();
        let tail = read_tail(&path, 100);
        assert_eq!(tail.lines().count(), 100);
        assert!(tail.starts_with("line-200"));
        assert!(tail.ends_with("line-299"));
        assert_eq!(read_tail(&dir.join("missing.log"), 10), "（无）");
    }

    #[test]
    fn truncate_respects_char_boundaries() {
        assert_eq!(truncate("abcdef", 10), "abcdef");
        assert_eq!(truncate("abcdef", 3), "abc…");
        let cjk = "简历模板";
        assert!(truncate(cjk, 2).starts_with("简历"));
        assert!(truncate(cjk, 2).ends_with('…'));
    }

    #[test]
    fn issue_url_encodes_query() {
        let url = issue_url(APP_REPO, "2.3.6", "line1\nline2 中文");
        assert!(url.starts_with(&format!("https://github.com/{APP_REPO}/issues/new?")));
        assert!(!url.contains('\n'));
        assert!(!url.contains(' '));
        assert!(url.contains("title="));
        assert!(url.contains("body="));
    }

    #[test]
    fn diagnostics_includes_context_and_tails() {
        let dir = temp_dir("diag");
        log(&dir, "info", "boot ok");
        let diag = build_diagnostics(&dir, "9.9.9");
        assert!(diag.contains("9.9.9"));
        assert!(diag.contains("boot ok"));
        assert!(diag.contains(&format!("{}", std::env::consts::OS)));
        assert!(diag.contains("（无）")); // server.log absent in the fixture
    }

    #[test]
    fn today_shape() {
        let day = today();
        assert_eq!(day.len(), 10);
        assert!(day.bytes().nth(4).unwrap() == b'-');
    }

    #[test]
    fn now_is_after_epoch() {
        let now = SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap();
        assert!(now.as_secs() > 1_700_000_000);
    }
}
