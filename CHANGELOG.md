# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
### Changed
### Fixed
### Removed
### Breaking changes

## [1.0.0]

### Added
- feat: Add `--no-modifyDay` option, allowing to modify date but keeping original day

### Changed
- chore(deps): Update dependencies

## [1.0.0-beta.4]

### Added
- feat: Add `--no-modifyTime` option, allowing to modify date but keeping original time information.
- feat: Add trace when using `--dryRun` option
- feat: Add `update-notifier`

### Changed
- feat: Set `DateTimeOriginal` using `DateTimeDigitized` only when the first one is empty and no other date is found.

### Fixed
- fix: Fix report when dryRun option is enabled
- chore: Add execution permissions to husky precommit file
- chore: Add missing test npm command. Execute both unit and e2e tests

## [1.0.0-beta.3]
### Fixed
- fix: Use piexijs dump method to detect if file is really supported
- fix: Error counting amount of files after modifications
- fix: Handle errors while writing exif info

## [1.0.0-beta.2]
### Fixed
- Add missing `commander` dependency

## [1.0.0-beta.1] - __NOT WORKING__
### Added
- Add `set-dates` command
