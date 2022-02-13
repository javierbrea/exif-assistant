[![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![License][license-image]][license-url]

# exif-assistant

CLI tool providing commands that read, write and edit images EXIF metadata. It processes entire directory trees, helping to detect and fill missing or wrong EXIF info in photos collections with a single command.

## Installation

This module should be installed globally using NPM

```bash
npm install -g exif-assistant
```

Once installed, you can use the `exif-assistant` CLI command to run any of the available [module commands](#commands):

```sh
exif-assistant set-dates ./photos
```

> Note: You can also use `npx` to use the module without installing it: `npx exif-assistant set-dates ./photos`

## Use cases

This package has been created to meet a specific requirement of the author: He owns a large collection of photos, and it contained lots of old files that didn't have any EXIF information. But files contained date information in their names, or in folder names. So, this program is mainly focused on filling EXIF dates based on file names or folder names recursively to an entire photos collection with a single command. Who knows, maybe it can be also useful for you 😃

For the moment, `set-dates` is the only one command available. But, the package has been developed in a way that more commands can be added in the future to provide similar features easily, such as adding GPS information, renaming or moving files based on EXIF info, removing EXIF info, etc. Feel free to open issues if you have any suggestion about more features that may be useful.

## Commands

### __set-dates__

Sets `DateTimeOriginal` Exif property to all supported images in a folder recursively. It can determine the date to be set to a specific file based on the file name, parent folder names, other Exif properties or user options. It can modify original files or create another output folder, in which it is able to copy even unsupported files, so you can get a whole copy of the folder, but with Exif dates modified when possible. As an extra, it can create subfolders on each folder tree and move files without date there after finishing, so you can easily examine the images to manually rename files or folders and run again the command only on those folders.

```sh
exif-assistant set-dates ./photos --dateFormat dd-MM --dateFormat yyyy --dateRegex "^date-(\S*)" --baseDate 2022
```

#### __How does it work__

The default priority for determining the date to be set into a file is the next one, but it can be modified using the command options:

* Date from the `date` option, if defined.
* Date in the `DateTimeDigitized` exif info.
* Date found in the file name.
* Date found in the parent folder. Searches recursively in parent folders until the input folder.
* Date from the `dateFallback` option.

Dates found could be partial depending on the provided `dateFormat` option (for example, a file name could contain info only about a day or a month). If such is the case, then it uses the next priority to determine the date used to complete it:

* Date from the `baseDate` option, if defined.
* Dates found in the parent folders. It searches recursively in parent folders until the input folder, completing each partial date with its parents dates. For example, a folder name could have the year info, contain folders with months info, containing files with days info, etc.
* Date from the `baseDateFallback` option.

> TIP: Use the `--dryRun` option to get a preview of the results without modifying any file, allowing you to adjust the options or folder names until every date is set with a single command.

#### __Arguments__

* `folder` - Path to the input folder
#### __Options__

| Option | Default value | Description | Example |
|---|---|---|---|
| `--dryRun` | `false` | Print report only. Do not modify any file | `--dryRun` |
| `-m, --modify` | `false` | Modify existing dates. By default, the program don't modify files already having `DateTimeOriginal` | `--modify` |
| `--no-setDigitized` | `false` | Do not set also `DateTimeDigitized` property. By default the program fills both `DateTimeOriginal` and `DateTimeDigitized` properties. This option disables that feature | `--no-setDigitized` |
| `-o, --outputFolder` | - | Write modified images to this folder instead of modifying original ones. The original folder tree is recreated | `--outputFolder ./modified-photos` |
| `-c, --copyAll` | `false` | Copy all files `outputFolder`, not only those being modified | `--copyAll` |
| `-u, --moveUnresolvedTo` | - | After finishing, move unsupported files or files without `DateTimeOriginal` to a subfolder with this name. The subfolder is created under the folder in which the file was originally. | `--moveUnresolvedTo no-date` |
| `-d, --date`| - | When provided, this date is set to all files. Must have [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601), or match with any of the formats provided in the `dateFormat` option | `--date 2022-02-12` |
| `-f, --dateFallback`| - | If the date for a file is not found anywhere else, set this date. Must have [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601), or match with any of the formats provided in the `dateFormat` option | `--dateFallback 2022-02` |
| `-b, --baseDate`| - | Date used to complete other dates when they are partial. For example, if dates in file names have only month and day, you can use this option to set the year for all dates. Must have [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601), or match with any of the formats provided in the `dateFormat` option | `--baseDate 2022` |
| `-b, --baseDateFallback`| - | If the base date for a file is not found anywhere else, use this one as base date. Note that the base date for a file is calculated using its parent folder names. Must have [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601), or match with any of the formats provided in the `dateFormat` option | `--baseDateFallback 2022-05` |
| `-f, --dateFormat` | [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601) | Formats used to parse dates from file or folder names or date options. [Multiple values can be provided](https://github.com/tj/commander.js#variadic-option). The dates will be parsed using the first matching format. Check the [`date-fns` docs](https://github.com/date-fns/date-fns) to learn more about defining date formats | `--dateFormat dd-MM-yyyy yyyy` |
| `-r, --dateRegex` | - | Regex used to extract dates from file or folder names. Regexs with a capturing group must be provided. [Multiple values can be provided](https://github.com/tj/commander.js#variadic-option) | `--dateRegex "^year-(\S*)$"` |
| `--no-fromDigitized` | `false` | Do not set `DateTimeOriginal` property using the value from the `DateTimeDigitized` property. By default, if the program found the `DateTimeDigitized` property, it uses it to set `DateTimeOriginal`. This option disables that feature. Implicit when `--date` option is used | `--no-fromDigitized` |
| `--no-fromFileName` | `false` | Do not set dates based on dates found in file names. Implicit when `--date` option is used | `--no-fromFileName` |
| `--no-fromFolderNames` | `false` | Do not set dates based on dates found in folder names. Implicit when `--date` option is used | `--no-fromFolderNames` |
| `--no-baseDatefromFolderNames` | `false` | Do not set base dates based on dates found in parent folder names. The program tries to complete partial dates for a file or folder using its parent folder names. This option disables that feature. Implicit when `--baseDate` option is used | `--no-baseDatefromFolderNames` |
| `-l, --log` | `info` | Log level. Can be one of `silly`, `debug`, `verbose`, `info`, `warn`, `error` or `silent` | `--log debug` |

## Acknowledgements

This package depends on next packages for some important internal core features:

* [`piexifjs`](https://github.com/hMatoba/piexifjs) - Used internally to read and write Exif data from/to image files.
* [`date-fns`](https://github.com/date-fns/date-fns) - Used internally to convert, calculate and parse dates.

## Contributing

Contributors are welcome.
Please read the [contributing guidelines](.github/CONTRIBUTING.md) and [code of conduct](.github/CODE_OF_CONDUCT.md).

## License

MIT, see [LICENSE](./LICENSE) for details.

[build-image]: https://github.com/javierbrea/exif-assistant/workflows/build/badge.svg?branch=main
[build-url]: https://github.com/javierbrea/exif-assistant/actions?query=workflow%3Abuild+branch%main
[coveralls-image]: https://coveralls.io/repos/github/javierbrea/exif-assistant/badge.svg
[coveralls-url]: https://coveralls.io/github/javierbrea/exif-assistant
[last-commit-image]: https://img.shields.io/github/last-commit/javierbrea/exif-assistant.svg
[last-commit-url]: https://github.com/javierbrea/exif-assistant/commits
[license-image]: https://img.shields.io/npm/l/exif-assistant.svg
[license-url]: https://github.com/javierbrea/exif-assistant/blob/main/LICENSE
[npm-downloads-image]: https://img.shields.io/npm/dm/exif-assistant.svg
[npm-downloads-url]: https://www.npmjs.com/package/exif-assistant
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=javierbrea_exif-assistant&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=javierbrea_exif-assistant
[release-image]: https://img.shields.io/github/release-date/javierbrea/exif-assistant.svg
[release-url]: https://github.com/javierbrea/exif-assistant/releases
