#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[path = "../studio_ui.rs"]
mod studio_ui;

fn main() -> iced::Result {
    studio_ui::run()
}
