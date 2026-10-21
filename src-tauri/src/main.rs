// Resume Studio desktop shell.
//
// The app itself is a vinext (Next-on-Vite) full-stack server, which needs a Node
// runtime. Tauri only provides the webview, so this shell:
//   1. picks a free loopback port,
//   2. spawns the bundled Node runtime to serve the built app,
//   3. waits for the port, then opens the webview on it,
//   4. kills the server when the app exits.
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

struct ServerState(Mutex<Option<Child>>);

fn free_port() -> u16 {
    TcpListener::bind(("127.0.0.1", 0))
        .and_then(|listener| listener.local_addr())
        .map(|addr| addr.port())
        .unwrap_or(3178)
}

fn runtime_dir(app: &tauri::App) -> Result<PathBuf, Box<dyn std::error::Error>> {
    if let Ok(dir) = std::env::var("RESUME_RUNTIME_DIR") {
        return Ok(PathBuf::from(dir));
    }
    Ok(app.path().resource_dir()?.join("runtime"))
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

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Dev shortcut: reuse an already-running dev server.
            if let Ok(url) = std::env::var("RESUME_DEV_URL") {
                let parsed = url::Url::parse(&url)?;
                WebviewWindowBuilder::new(app, "main", WebviewUrl::External(parsed))
                    .title("Resume Studio")
                    .inner_size(1500.0, 960.0)
                    .min_inner_size(1000.0, 700.0)
                    .build()?;
                return Ok(());
            }

            let runtime = runtime_dir(app)?;
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let log_path = data_dir.join("server.log");

            println!("[resume-studio] runtime={}", runtime.display());
            println!("[resume-studio] data={}", data_dir.display());

            let port = free_port();
            let child = spawn_server(&runtime, &data_dir, port, &log_path)?;
            app.manage(ServerState(Mutex::new(Some(child))));

            let ready = wait_for_port(port, Duration::from_secs(45));
            println!("[resume-studio] serving on http://127.0.0.1:{port}/ ready={ready}");

            if ready {
                let url = url::Url::parse(&format!("http://127.0.0.1:{port}/"))?;
                WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                    .title("Resume Studio")
                    .inner_size(1500.0, 960.0)
                    .min_inner_size(1000.0, 700.0)
                    .build()?;
            } else {
                // Surface a readable failure instead of a blank window.
                WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                    .title("Resume Studio — 启动失败")
                    .inner_size(900.0, 560.0)
                    .build()?;
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
