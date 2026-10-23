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
// actionable instead of a silent crash.
//
// Dev escape hatches:
//   RESUME_DEV_URL       point the window at an already-running server
//   RESUME_RUNTIME_DIR   use a loose runtime dir instead of the bundled resource

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};

const APP_ID: &str = "dev.linzhiyuan.resume-studio";

struct ServerState(Mutex<Option<Child>>);

fn free_port() -> u16 {
    TcpListener::bind(("127.0.0.1", 0))
        .and_then(|listener| listener.local_addr())
        .map(|addr| addr.port())
        .unwrap_or(3178)
}

/// Bundled runtime dir: env override → resource dir → ../Resources next to the exe.
fn resolve_runtime_dir(app: &tauri::App) -> Option<PathBuf> {
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
fn resolve_data_dir(app: &tauri::App) -> PathBuf {
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

fn wait_for_port(port: u16, timeout: Duration) -> bool {
    let started = Instant::now();
    while started.elapsed() < timeout {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(120));
    }
    false
}

fn spawn_server(runtime: &Path, data_dir: &Path, port: u16, log: &Path) -> std::io::Result<Child> {
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

fn open_window(app: &mut tauri::App, url: url::Url) -> tauri::Result<()> {
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

fn boot(app: &mut tauri::App) -> Result<(), String> {
    // Dev shortcut: reuse an already-running dev server.
    if let Ok(raw) = std::env::var("RESUME_DEV_URL") {
        let url = url::Url::parse(&raw).map_err(|e| format!("RESUME_DEV_URL 无效: {e}"))?;
        return open_window(app, url).map_err(|e| e.to_string());
    }

    let runtime = resolve_runtime_dir(app).ok_or("找不到内置 Node 运行时（runtime/）")?;
    let data_dir = resolve_data_dir(app);
    std::fs::create_dir_all(&data_dir).map_err(|e| format!("无法创建数据目录: {e}"))?;
    let log_path = data_dir.join("server.log");

    println!("[resume-studio] runtime={}", runtime.display());
    println!("[resume-studio] data={}", data_dir.display());

    let port = free_port();
    let child = spawn_server(&runtime, &data_dir, port, &log_path)
        .map_err(|e| format!("无法启动内置服务: {e}"))?;
    app.manage(ServerState(Mutex::new(Some(child))));

    let ready = wait_for_port(port, Duration::from_secs(45));
    println!("[resume-studio] serving on http://127.0.0.1:{port}/ ready={ready}");

    if ready {
        let url = url::Url::parse(&format!("http://127.0.0.1:{port}/"))
            .map_err(|e| format!("地址无效: {e}"))?;
        open_window(app, url).map_err(|e| e.to_string())
    } else {
        Err(format!(
            "内置服务 45 秒内未就绪，日志：{}",
            log_path.display()
        ))
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            if let Err(err) = boot(app) {
                eprintln!("[resume-studio] setup failed: {err}");
                open_error_window(app);
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build Resume Studio")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<ServerState>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                            let _ = child.wait();
                        }
                    }
                }
            }
        });
}
