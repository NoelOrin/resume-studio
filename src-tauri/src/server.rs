//! Bundled Node runtime lifecycle: spawn, readiness wait, teardown, crash watch.

use std::fs::File;
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::Ordering;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{App, AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::logger;

pub struct ServerState(pub Mutex<Option<Child>>);

pub fn free_port() -> u16 {
    TcpListener::bind(("127.0.0.1", 0))
        .and_then(|listener| listener.local_addr())
        .map(|addr| addr.port())
        .unwrap_or(3178)
}

/// Bundled runtime dir: env override → resource dir → ../Resources next to the exe.
pub fn resolve_runtime_dir(app: &App) -> Option<PathBuf> {
    if let Ok(dir) = std::env::var("RESUME_RUNTIME_DIR") {
        return Some(PathBuf::from(dir));
    }
    if let Ok(resources) = app.path().resource_dir() {
        let dir = resources.join("runtime");
        if dir.is_dir() {
            return Some(dir);
        }
    }
    let exe = std::env::current_exe().ok()?;
    let dir = exe.parent()?.parent()?.join("Resources").join("runtime");
    dir.is_dir().then_some(dir)
}

/// Writable data dir: app data dir → ~/Library/Application Support/<id> → temp.
pub fn resolve_data_dir(app: &App) -> PathBuf {
    resolve_data_dir_by_handle(&app.handle())
}

pub fn resolve_data_dir_by_handle(app: &AppHandle) -> PathBuf {
    const APP_ID: &str = "dev.linzhiyuan.resume-studio";
    if let Ok(dir) = app.path().app_data_dir() {
        return dir;
    }
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join(APP_ID);
    }
    std::env::temp_dir().join("resume-studio")
}

pub fn wait_for_port(port: u16, timeout: Duration) -> bool {
    let started = Instant::now();
    while started.elapsed() < timeout {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(120));
    }
    false
}

pub fn spawn_server(runtime: &Path, data_dir: &Path, port: u16, log: &Path) -> std::io::Result<Child> {
    let node = runtime.join(if cfg!(windows) { "node.exe" } else { "node" });
    let cli = runtime.join("node_modules").join("vinext").join("dist").join("cli.js");

    let stdout = File::create(log)?;
    let stderr = stdout.try_clone()?;

    Command::new(node)
        .arg(cli)
        .arg("start")
        .arg("--port")
        .arg(port.to_string())
        .current_dir(runtime)
        .env("NODE_ENV", "production")
        .env("RESUME_DATA_DIR", data_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::from(stdout.try_clone()?))
        .stderr(Stdio::from(stderr))
        .spawn()
}

/// Watches the spawned server. If it dies outside of a normal shutdown the user
/// gets a system notification — everything else (logging) is best-effort.
pub fn spawn_crash_monitor(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(2));
        let Some(state) = app.try_state::<ServerState>() else { break };
        let outcome = {
            let Ok(mut guard) = state.0.lock() else { break };
            match guard.as_mut() {
                // Taken by the Exit handler — a normal teardown is in progress.
                None => break,
                Some(child) => child.try_wait(),
            }
        };
        match outcome {
            Ok(Some(status)) => {
                if let Ok(mut guard) = state.0.lock() {
                    guard.take();
                }
                let shutting_down = app
                    .try_state::<crate::AppState>()
                    .map(|s| s.shutting_down.load(Ordering::SeqCst))
                    .unwrap_or(true);
                if shutting_down {
                    break;
                }
                let data_dir = app
                    .try_state::<crate::AppState>()
                    .map(|s| s.data_dir.clone());
                if let Some(dir) = &data_dir {
                    logger::log(dir, "error", &format!("内置服务意外退出（{status}）"));
                }
                let _ = app
                    .notification()
                    .builder()
                    .title("Resume Studio")
                    .body("内置服务已意外退出，请重启应用。")
                    .show();
                if let Some(dir) = &data_dir {
                    logger::log(dir, "info", "已发送内置服务故障通知");
                }
                break;
            }
            Ok(None) => {}
            Err(err) => {
                if let Some(dir) = app.try_state::<crate::AppState>().map(|s| s.data_dir.clone()) {
                    logger::log(&dir, "warn", &format!("监控内置服务进程失败: {err}"));
                }
                break;
            }
        }
    });
}
