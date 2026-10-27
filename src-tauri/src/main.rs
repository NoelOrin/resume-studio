// Resume Studio desktop shell.
//
// The app itself is a vinext (Next-on-Vite) full-stack server, which needs a Node
// runtime. Tauri only provides the webview, so this shell:
//   1. picks a free loopback port,
//   2. spawns the bundled Node runtime to serve the built app,
//   3. waits for the port, then opens the webview on it,
//   4. kills the server when the app exits.
//
// Setup never panics: a failure opens `error.html` so the user sees something
// actionable instead of a silent crash. Tray/notifications/logging follow the
// same rule — any failure is logged and the app keeps working without it.
//
// Resident mode: once the tray is live, closing the main window hides it and
// the app keeps running in the tray (macOS keeps the Dock icon). The shell
// polls the local server's /api/update hourly so update notifications work
// while the window is closed. See
// docs/superpowers/specs/2026-10-27-desktop-capabilities-design.md.
//
// Dev escape hatches:
//   RESUME_DEV_URL       point the window at an already-running server
//                        (port is recorded as 0: no polling, no crash watch)
//   RESUME_RUNTIME_DIR   use a loose runtime dir instead of the bundled resource

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod logger;
mod server;
mod tray;
mod updater;

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_single_instance::init as single_instance_init;

use server::ServerState;

pub struct AppState {
    pub data_dir: PathBuf,
    /// Bundled server port; 0 in dev mode (RESUME_DEV_URL) — no polling/watch.
    pub port: u16,
    /// Tray is live → closing the main window hides instead of quitting.
    pub tray_ready: AtomicBool,
    /// Set on ExitRequested/quit so the crash monitor stays quiet during teardown.
    pub shutting_down: AtomicBool,
    pub update: Mutex<updater::UpdateState>,
}

fn focus_main(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn open_window(app: &tauri::App, url: url::Url) -> tauri::Result<()> {
    WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
        .title("Resume Studio")
        .inner_size(1500.0, 960.0)
        .min_inner_size(1000.0, 700.0)
        .center()
        .build()?;
    Ok(())
}

fn open_error_window(app: &mut tauri::App) {
    let _ = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("error.html".into()))
        .title("Resume Studio — 启动失败")
        .inner_size(860.0, 520.0)
        .build();
}

/// Boots the bundled server (or reuses the dev URL). Returns the data dir and
/// the port the server listens on (0 in dev mode).
fn boot(app: &mut tauri::App, dev_url: Option<&str>) -> Result<(PathBuf, u16), String> {
    if let Some(raw) = dev_url {
        let url = url::Url::parse(raw).map_err(|e| format!("RESUME_DEV_URL 无效: {e}"))?;
        open_window(app, url).map_err(|e| e.to_string())?;
        return Ok((server::resolve_data_dir(app), 0));
    }

    let runtime = server::resolve_runtime_dir(app).ok_or("找不到内置 Node 运行时（runtime/）")?;
    let data_dir = server::resolve_data_dir(app);
    std::fs::create_dir_all(&data_dir).map_err(|e| format!("无法创建数据目录: {e}"))?;
    let log_path = data_dir.join("server.log");

    // stdout lines are the ops/CI contract (the packaged-app smoke test greps
    // the serving line for the port); shell.log is the diagnostics copy.
    println!("[resume-studio] runtime={}", runtime.display());
    println!("[resume-studio] data={}", data_dir.display());
    logger::log(
        &data_dir,
        "info",
        &format!("启动：runtime={} data={}", runtime.display(), data_dir.display()),
    );

    let port = server::free_port();
    let child = server::spawn_server(&runtime, &data_dir, port, &log_path).map_err(|e| {
        logger::log(&data_dir, "error", &format!("无法启动内置服务: {e}"));
        format!("无法启动内置服务: {e}")
    })?;
    app.manage(ServerState(Mutex::new(Some(child))));

    let ready = server::wait_for_port(port, Duration::from_secs(45));
    println!("[resume-studio] serving on http://127.0.0.1:{port}/ ready={ready}");
    logger::log(&data_dir, "info", &format!("内置服务就绪 port={port} ready={ready}"));

    if ready {
        let url = url::Url::parse(&format!("http://127.0.0.1:{port}/"))
            .map_err(|e| format!("地址无效: {e}"))?;
        open_window(app, url).map_err(|e| e.to_string())?;
        Ok((data_dir, port))
    } else {
        Err(format!(
            "内置服务 45 秒内未就绪，日志：{}",
            log_path.display()
        ))
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(single_instance_init(|app, _args, _cwd| {
            focus_main(app);
        }))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            match boot(app, std::env::var("RESUME_DEV_URL").ok().as_deref()) {
                Ok((data_dir, port)) => {
                    app.manage(AppState {
                        data_dir,
                        port,
                        tray_ready: AtomicBool::new(false),
                        shutting_down: AtomicBool::new(false),
                        update: Mutex::new(updater::UpdateState::default()),
                    });
                    let handle = app.handle().clone();
                    tray::init(&handle);
                    if port != 0 {
                        updater::spawn_poller(handle.clone());
                        server::spawn_crash_monitor(handle);
                    }
                }
                Err(err) => {
                    eprintln!("[resume-studio] setup failed: {err}");
                    let data_dir = server::resolve_data_dir(app);
                    logger::log(&data_dir, "error", &format!("启动失败: {err}"));
                    open_error_window(app);
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() != "main" {
                    return;
                }
                let resident = window
                    .app_handle()
                    .try_state::<AppState>()
                    .map(|state| state.tray_ready.load(Ordering::SeqCst))
                    .unwrap_or(false);
                if resident {
                    api.prevent_close();
                    let _ = window.hide();
                    if let Some(state) = window.app_handle().try_state::<AppState>() {
                        logger::log(&state.data_dir, "info", "主窗口关闭 → 驻留托盘");
                    }
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("failed to build Resume Studio")
        .run(|app_handle, event| match event {
            // macOS: clicking the Dock icon while the window is hidden.
            #[cfg(target_os = "macos")]
            RunEvent::Reopen { has_visible_windows, .. } => {
                if !has_visible_windows {
                    focus_main(app_handle);
                }
            }
            RunEvent::ExitRequested { .. } => {
                if let Some(state) = app_handle.try_state::<AppState>() {
                    state.shutting_down.store(true, Ordering::SeqCst);
                }
            }
            RunEvent::Exit => {
                if let Some(state) = app_handle.try_state::<AppState>() {
                    state.shutting_down.store(true, Ordering::SeqCst);
                    logger::log(&state.data_dir, "info", "应用退出");
                }
                if let Some(state) = app_handle.try_state::<ServerState>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                            let _ = child.wait();
                        }
                    }
                }
            }
            _ => {}
        });
}
