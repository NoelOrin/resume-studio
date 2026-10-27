//! Menu-bar / system tray. Built best-effort: if the platform has no tray, the
//! shell logs it and close-to-tray stays disabled (window close = quit, as before).

use std::path::Path;
use std::sync::atomic::Ordering;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIcon, TrayIconBuilder};
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_opener::OpenerExt;

use crate::logger;
use crate::updater;
use crate::AppState;

const TRAY_ID: &str = "resume-tray";

/// Returns `true` when the tray is live (and close-to-tray may be enabled).
pub fn init(app: &AppHandle) -> bool {
    match build(app) {
        Ok(_tray) => {
            if let Some(state) = app.try_state::<AppState>() {
                state.tray_ready.store(true, Ordering::SeqCst);
                logger::log(&state.data_dir, "info", "托盘就绪，关窗驻留已启用");
            }
            true
        }
        Err(err) => {
            let data_dir = app
                .try_state::<AppState>()
                .map(|s| s.data_dir.clone());
            if let Some(dir) = &data_dir {
                logger::log(dir, "warn", &format!("托盘创建失败，关窗驻留停用: {err}"));
            } else {
                eprintln!("[resume-studio] tray init failed: {err}");
            }
            false
        }
    }
}

fn build(app: &AppHandle) -> tauri::Result<TrayIcon<Wry>> {
    let open = MenuItem::with_id(app, "open", "打开 Resume Studio", true, None::<&str>)?;
    let check = MenuItem::with_id(app, "check-update", "检查更新", true, None::<&str>)?;
    let data = MenuItem::with_id(app, "open-data-dir", "打开数据目录", true, None::<&str>)?;
    let issue = MenuItem::with_id(app, "report-issue", "反馈问题…", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &open,
            &check,
            &data,
            &issue,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ],
    )?;

    let version = env!("CARGO_PKG_VERSION");
    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu)
        .show_menu_on_left_click(true)
        .tooltip(updater::default_tooltip(version))
        .on_menu_event(|app, event| handle_menu(app, event.id().as_ref()));
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)
}

fn handle_menu(app: &AppHandle, id: &str) {
    let Some(state) = app.try_state::<AppState>() else { return };
    let data_dir = state.data_dir.clone();
    match id {
        "open" => crate::focus_main(app),
        "check-update" => updater::check_on_demand(app),
        "open-data-dir" => {
            if let Err(err) = app.opener().open_path(data_dir.to_string_lossy(), None::<&str>) {
                logger::log(&data_dir, "warn", &format!("打开数据目录失败: {err}"));
            }
        }
        "report-issue" => report_issue(app, &data_dir),
        "quit" => {
            state.shutting_down.store(true, Ordering::SeqCst);
            logger::log(&data_dir, "info", "托盘退出");
            app.exit(0);
        }
        _ => {}
    }
}

/// Diagnostics → clipboard (best-effort) → prefilled GitHub issue in the
/// browser. Without a clipboard, the tail is inlined (truncated) and the data
/// directory opens so the user can attach full logs manually.
fn report_issue(app: &AppHandle, data_dir: &Path) {
    let version = env!("CARGO_PKG_VERSION");
    let diagnostics = logger::build_diagnostics(data_dir, version);
    let mut clip_ok = false;
    match arboard::Clipboard::new() {
        Ok(mut clipboard) => {
            clip_ok = clipboard.set_text(diagnostics.clone()).is_ok();
        }
        Err(err) => logger::log(data_dir, "warn", &format!("剪贴板不可用: {err}")),
    }

    let body = if clip_ok {
        "描述遇到的问题：\n\n\n（诊断信息已复制到剪贴板，请粘贴到此处）".to_string()
    } else {
        format!(
            "描述遇到的问题：\n\n\n（剪贴板不可用：请手动附上数据目录中的 shell.log / server.log）\n\n{}",
            logger::truncate(&diagnostics, 2000)
        )
    };
    let url = logger::issue_url(logger::APP_REPO, version, &body);
    if let Err(err) = app.opener().open_url(url, None::<&str>) {
        logger::log(data_dir, "warn", &format!("打开问题反馈页失败: {err}"));
        let _ = app
            .notification()
            .builder()
            .title("反馈问题")
            .body("浏览器打开失败，请手动访问 GitHub 仓库 Issues 页。")
            .show();
    }
    if !clip_ok {
        if let Err(err) = app.opener().open_path(data_dir.to_string_lossy(), None::<&str>) {
            logger::log(data_dir, "warn", &format!("打开数据目录失败: {err}"));
        }
    }
    logger::log(
        data_dir,
        "info",
        &format!("反馈问题：clipboard={clip_ok}"),
    );
}
