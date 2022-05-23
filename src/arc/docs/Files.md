# ARC files

ARC keeps the configuration and data files on local machine. This document describes the files kept by the application.

## Root directory

The following mapping is used when the application is installed by the installer:

- Windows: `%APPDATA%`
- Linux: `$XDG_CONFIG_HOME` or `~/.config`
- macOS: `~/Library/Application Support`

## Themes

Themes are located under `root` + `themes-esm`. This can be configured with the `--themes-path` startup option.

## Workspaces

Application workspace state files are located under `root` + `workspace` directory. This can be configured with the `--workspace-path` startup option.

Each workspace represents the current state of the main editor. It keeps current request data. The user can switch between the workspaces or open a new application window with another workspace.

Workspaces are not synchronized with the underlying data store. The user has to perform the "save" action to commit
changes to the data store.

## Application settings

Application settings file is located under the `root` + `settings.json` file. This can be configured with the `--settings-file` startup option.
