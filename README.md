# git-tag-changelog

[![NPM Version](https://img.shields.io/npm/v/git-tag-changelog.svg)](https://npmjs.org/package/git-tag-changelog)
![Build](https://github.com/DonutEspresso/git-tag-changelog/workflows/Node.js%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/DonutEspresso/git-tag-changelog/badge.svg?branch=master)](https://coveralls.io/github/DonutEspresso/git-tag-changelog?branch=master)
[![Dependency Status](https://david-dm.org/DonutEspresso/git-tag-changelog.svg)](https://david-dm.org/DonutEspresso/git-tag-changelog)
[![devDependency Status](https://david-dm.org/DonutEspresso/git-tag-changelog/dev-status.svg)](https://david-dm.org/DonutEspresso/git-tag-changelog#info=devDependencies)

> Create change logs, saving them in git tag annotations

This command line tool relies on the defacto standard of semver like tags
existing within a repository. i.e., v1.0.0, v1.5.0, v2.0.0, etc.

It uses these tags to determine commits, find delta commits between tags, and
to generate changelogs based on those delta commits. The changelog is actually
just a grouping of commit messages using the prefix string of the commit
message, assuming you are using something like conventional commit. The grouped
commit messages are then saved to the annotation of a git tag.

You can push these tags up to origin, and if you are using Github, it will
automatically show up in the "releases" section of the repo.

Note that this tool does not take the place of something like conventional
commit tooling or release tooling - it merely crawls your commit messages, and
creates a "changelog" that is then attached to existing tags within your repo.

## Getting Started

Install the module with: `npm install git-tag-changelog`

## Usage

Installing this module exposes a CLI command you can use:

```sh
$ cl -h
usage: cl [ACTION] [OPTIONS]

actions: 'list' | 'delta' | 'release' | 'nuclear'
options:
    -h, --help              Print this help and exit.
    -d, --dry               Dry run. Does not actually execute command.
    -l NUM, --logLevel=NUM  Logging level, valid values: 10, 20, 30, 40, 50.
    --v1=ARG                For 'delta' action. A semver version.
    --v2=ARG                For 'delta' action. A semver version.
    --version=ARG           For 'release' and 'rerelease' action. The semver of
                            the release.
    --raw                   Display raw results instead.
    --yesReally             Confirmation flag for the 'nuclear' action.

sample usage:
    * show all git tags that look like releases (semver):
        cl list
    * show semantic changes between two tags (order agnostic):
        cl delta --v1=4.0.0 --v2=6.0.0
    * recreate a changelog for an existing version:
        cl rerelease --version=7.7.0
    * create a changelog for a new release, and put it in the annotation of a git tag:
        cl release --version=8.0.0
    * DANGER: loop through all existing tags and recreate changelogs:
        cl nuclear --yesReally
```

## Contributing

Ensure that all linting and codestyle tasks are passing. Add unit tests for any
new or changed functionality.

To start contributing, install the git prepush hooks:

```sh
make githooks
```

Before committing, lint and test your code using the included Makefile:
```sh
make prepush
```

## License

Copyright (c) 2019 Alex Liu

Licensed under the MIT license.
