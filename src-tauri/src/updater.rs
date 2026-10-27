//! Background update polling for the resident shell.
//!
//! The bundled Node server already owns all GitHub lookup and version-compare
//! logic (`/api/update`); this module only polls it on localhost, so there is a
//! single implementation of "is there a new release". Notifications follow one
//! rule: the user is only bothered when they are not looking at the app.

use std::time::Duration;

use serde_json::Value;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::logger;
use crate::AppState;

const TRAY_ID: &str = "resume-tray";
const FIRST_CHECK_DELAY: Duration = Duration::from_secs(90);
const POLL_INTERVAL: Duration = Duration::from_secs(60 * 60);

#[derive(Default)]
pub struct UpdateState {
    /// `(latest_version, day)` of the last auto notification — one per version per day.
    pub last_auto_notified: Option<(String, String)>,
}

pub fn default_tooltip(version: &str) -> String {
    format!("Resume Studio v{version}")
}

pub fn update_tooltip(version: &str, latest: &str) -> String {
    format!("Resume Studio v{version} — 新版本 {latest} 可用")
}

/// Hourly poller; runs for the whole process lifetime (resident mode included).
pub fn spawn_poller(app: AppHandle) {
    std::thread::spawn(move || {
        std::thread::sleep(FIRST_CHECK_DELAY);
        loop {
            check(&app, false);
            std::thread::sleep(POLL_INTERVAL);
        }
    });
}

/// Tray「检查更新」: blocking fetch on a worker thread, result always surfaces.
pub fn check_on_demand(app: &AppHandle) {
    let handle = app.clone();
    std::thread::spawn(move || check(&handle, true));
}

fn window_visible(app: &AppHandle) -> bool {
    app.get_webview_window("main")
        .and_then(|win| win.is_visible().ok())
        .unwrap_or(false)
}

fn set_tooltip(app: &AppHandle, tooltip: String) {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_tooltip(Some(tooltip));
    }
}

fn notify(app: &AppHandle, title: &str, body: &str) {
    let shown = app
        .notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .is_ok();
    if let Some(state) = app.try_state::<AppState>() {
        if shown {
            logger::log(&state.data_dir, "info", &format!("系统通知已发送：{title} / {body}"));
        } else {
            logger::log(&state.data_dir, "error", &format!("系统通知发送失败：{title}"));
        }
    }
}

fn check(app: &AppHandle, manual: bool) {
    let Some(state) = app.try_state::<AppState>() else { return };
    let version = env!("CARGO_PKG_VERSION");

    if state.port == 0 {
        // Dev escape hatch (RESUME_DEV_URL): no bundled server to poll.
        if manual {
            notify(app, "更新检查", "开发模式未运行内置服务，已跳过。");
        }
        return;
    }

    let result = fetch(state.port);
    let data_dir = state.data_dir.clone();
    match result {
        Err(err) => {
            logger::log(&data_dir, "warn", &format!("更新检查失败：{err}"));
            if manual {
                notify(app, "更新检查失败", &err);
            }
        }
        Ok(value) => {
            let ok = value.get("ok").and_then(Value::as_bool).unwrap_or(false);
            let latest = value
                .get("latest")
                .and_then(Value::as_str)
                .map(str::to_string);
            let has_update = value
                .get("hasUpdate")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            if !ok {
                let detail = value
                    .get("error")
                    .and_then(Value::as_str)
                    .unwrap_or("未知原因");
                logger::log(&data_dir, "warn", &format!("更新检查未完成：{detail}"));
                if manual {
                    notify(app, "更新检查失败", detail);
                }
                return;
            }
            match (has_update, latest) {
                (true, Some(latest)) => {
                    set_tooltip(app, update_tooltip(version, &latest));
                    let already = state
                        .update
                        .lock()
                        .ok()
                        .and_then(|guard| guard.last_auto_notified.clone())
                        .map(|(seen_ver, seen_day)| {
                            seen_ver == latest && seen_day == logger::today()
                        })
                        .unwrap_or(false);
                    let suppressed = already || (!manual && window_visible(app));
                    logger::log(
                        &data_dir,
                        "info",
                        &format!(
                            "发现新版本 {latest}（manual={manual} seen_today={already} visible={} suppressed={suppressed}）",
                            window_visible(app)
                        ),
                    );
                    if !suppressed {
                        notify(
                            app,
                            &format!("Resume Studio 有新版本 {latest}"),
                            "打开应用，在「设置 → 更新」查看说明与下载。",
                        );
                        if let Ok(mut guard) = state.update.lock() {
                            guard.last_auto_notified = Some((latest.clone(), logger::today()));
                        }
                    }
                }
                (false, _) => {
                    set_tooltip(app, default_tooltip(version));
                    logger::log(&data_dir, "info", "更新检查完成：已是最新版本");
                    if manual {
                        notify(app, "已是最新版本", &format!("当前版本 v{version}。"));
                    }
                }
                // Upstream says "update" but has no release version — nothing to say yet.
                (true, None) => {
                    logger::log(&data_dir, "warn", "更新检查异常：hasUpdate 但缺 latest");
                }
            }
        }
    }
}

fn fetch(port: u16) -> Result<Value, String> {
    let url = format!("http://127.0.0.1:{port}/api/update");
    let response = ureq::get(&url)
        .timeout(Duration::from_secs(15))
        .call()
        .map_err(|err| format!("请求 {url} 失败: {err}"))?;
    let body = response
        .into_string()
        .map_err(|err| format!("读取更新响应失败: {err}"))?;
    serde_json::from_str(&body).map_err(|err| format!("解析更新响应失败: {err}"))
}

/// Guard so tests can assert the throttling shape without spawning threads.
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    #[test]
    fn tooltips() {
        assert_eq!(default_tooltip("2.3.6"), "Resume Studio v2.3.6");
        assert_eq!(
            update_tooltip("2.3.6", "2.4.0"),
            "Resume Studio v2.3.6 — 新版本 2.4.0 可用"
        );
    }

    #[test]
    fn update_state_defaults_empty() {
        let state = UpdateState::default();
        assert!(state.last_auto_notified.is_none());
        assert!(Mutex::new(state).lock().is_ok());
    }

    #[test]
    fn poll_intervals_sane() {
        assert_eq!(POLL_INTERVAL, Duration::from_secs(3600));
        assert_eq!(FIRST_CHECK_DELAY, Duration::from_secs(90));
    }
}
