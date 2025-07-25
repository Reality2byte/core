# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Bump `@metamask/utils` from `^11.2.0` to `^11.4.2` ([#6054](https://github.com/MetaMask/core/pull/6054))
- Bump `@metamask/base-controller` from `^8.0.0` to `^8.0.1` ([#5722](https://github.com/MetaMask/core/pull/5722))
- Bump `@metamask/controller-utils` to `^11.11.0` ([#5935](https://github.com/MetaMask/core/pull/5935), [#5583](https://github.com/MetaMask/core/pull/5583), [#5765](https://github.com/MetaMask/core/pull/5765), [#5812](https://github.com/MetaMask/core/pull/5812), [#6069](https://github.com/MetaMask/core/pull/6069))

## [11.0.6]

### Changed

- Bump `@metamask/base-controller` from `^7.1.1` to `^8.0.0` ([#5305](https://github.com/MetaMask/core/pull/5305))
- Bump `@metamask/controller-utils` from `^11.4.5` to `^11.5.0` ([#5272](https://github.com/MetaMask/core/pull/5272))
- Bump `@metamask/json-rpc-engine` from `^10.0.2` to `^10.0.3` ([#5272](https://github.com/MetaMask/core/pull/5272))
- Bump `@metamask/utils` from `^11.0.1` to `^11.1.0` ([#5223](https://github.com/MetaMask/core/pull/5223))

## [11.0.5]

### Changed

- Remove redundant caveat validator calls ([#5062](https://github.com/MetaMask/core/pull/5062))
  - In some cases, caveats were being validated multiple times or without the
    possibility of being changed.
  - The intended purpose of permission and caveat validators has also been
    documented. See `ARCHITECTURE.md`.
- Bump `nanoid` from `^3.1.31` to `^3.3.8` ([#5073](https://github.com/MetaMask/core/pull/5073))
- Bump `@metamask/utils` from `^10.0.0` to `^11.0.1` ([#5080](https://github.com/MetaMask/core/pull/5080))
- Bump `@metamask/rpc-errors` from `^7.0.0` to `^7.0.2` ([#5080](https://github.com/MetaMask/core/pull/5080))
- Bump `@metamask/base-controller` from `^7.0.0` to `^7.1.1` ([#5079](https://github.com/MetaMask/core/pull/5079)), ([#5135](https://github.com/MetaMask/core/pull/5135))

## [11.0.4]

### Changed

- Bump `@metamask/controller-utils` from `^11.4.1` to `^11.4.4` ([#4870](https://github.com/MetaMask/core/pull/4870)), [#4915](https://github.com/MetaMask/core/pull/4915), [#5012](https://github.com/MetaMask/core/pull/5012))

### Fixed

- Correct ESM-compatible build so that imports of the following packages that re-export other modules via `export *` are no longer corrupted: ([#5011](https://github.com/MetaMask/core/pull/5011))
  - `deep-freeze-strict`

## [11.0.3]

### Changed

- Bump `@metamask/utils` from `^9.1.0` to `^10.0.0` ([#4831](https://github.com/MetaMask/core/pull/4831))

## [11.0.2]

### Fixed

- Produce and export ESM-compatible TypeScript type declaration files in addition to CommonJS-compatible declaration files ([#4648](https://github.com/MetaMask/core/pull/4648))
  - Previously, this package shipped with only one variant of type declaration
    files, and these files were only CommonJS-compatible, and the `exports`
    field in `package.json` linked to these files. This is an anti-pattern and
    was rightfully flagged by the
    ["Are the Types Wrong?"](https://arethetypeswrong.github.io/) tool as
    ["masquerading as CJS"](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md).
    All of the ATTW checks now pass.
- Remove chunk files ([#4648](https://github.com/MetaMask/core/pull/4648)).
  - Previously, the build tool we used to generate JavaScript files extracted
    common code to "chunk" files. While this was intended to make this package
    more tree-shakeable, it also made debugging more difficult for our
    development teams. These chunk files are no longer present.

## [11.0.1]

### Changed

- Bump `@metamask/base-controller` from `^6.0.3` to `^7.0.0` ([#4643](https://github.com/MetaMask/core/pull/4643))
- Bump `@metamask/controller-utils` from `^11.0.2` to `^11.2.0` ([#4639](https://github.com/MetaMask/core/pull/4639), [#4651](https://github.com/MetaMask/core/pull/4651))
- Bump `typescript` from `~5.0.4` to `~5.2.2` ([#4576](https://github.com/MetaMask/core/pull/4576), [#4584](https://github.com/MetaMask/core/pull/4584))

## [11.0.0]

### Changed

- **BREAKING:** Rename enum property names to match PascalCase instead of camelCase ([#4521](https://github.com/MetaMask/core/pull/4521))
  - The affected enums are: `CaveatMutatorOperations`, `MethodNames`.
- Bump TypeScript version to `~5.0.4` and set `moduleResolution` option to `Node16` ([#3645](https://github.com/MetaMask/core/pull/3645))
- Bump `@metamask/base-controller` from `^6.0.1` to `^6.0.2` ([#4544](https://github.com/MetaMask/core/pull/4544))
- Bump `@metamask/controller-utils` from `^11.0.1` to `^11.0.2` ([#4544](https://github.com/MetaMask/core/pull/4544))
- Bump `@metamask/json-rpc-engine` from `^9.0.1` to `^9.0.2` ([#4544](https://github.com/MetaMask/core/pull/4544))
- Bump `@metamask/utils` from `^9.0.0` to `^9.1.0` ([#4529](https://github.com/MetaMask/core/pull/4529))

## [10.0.1]

### Changed

- Bump `@metamask/rpc-errors` from `6.2.1` to `^6.3.1` ([#4516](https://github.com/MetaMask/core/pull/4516))
- Bump `@metamask/utils` from `^8.3.0` to `^9.0.0` ([#4516](https://github.com/MetaMask/core/pull/4516))
- Bump `@metamask/base-controller` to `^9.0.1` ([#4517](https://github.com/MetaMask/core/pull/4517))
- Bump `@metamask/controller-utils` to `^11.0.1` ([#4517](https://github.com/MetaMask/core/pull/4517))
- Bump `@metamask/json-rpc-engine` to `^9.0.1` ([#4517](https://github.com/MetaMask/core/pull/4517))

## [10.0.0]

### Changed

- **BREAKING:** Bump minimum Node version to 18.18 ([#3611](https://github.com/MetaMask/core/pull/3611))
- **BREAKING:** Bump peer dependency `@metamask/approval-controller` to `^7.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- Bump `@metamask/base-controller` to `^6.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- Bump `@metamask/controller-utils` to `^11.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))
- Bump `@metamask/json-rpc-engine` to `^9.0.0` ([#4352](https://github.com/MetaMask/core/pull/4352))

## [9.1.1]

### Changed

- Bump `@metamask/controller-utils` to `^10.0.0` ([#4342](https://github.com/MetaMask/core/pull/4342))

## [9.1.0]

### Added

- Add `requestPermissionsIncremental()` and caveat merger functions ([#4222](https://github.com/MetaMask/core/pull/4222))
- Enable passing additional metadata during permission requests ([#4179](https://github.com/MetaMask/core/pull/4179))
- Make permission request validation errors more informative ([#4172](https://github.com/MetaMask/core/pull/4172))

## [9.0.2]

### Fixed

- Fix `SideEffectMessenger` type not respecting generic parameter types ([#4059](https://github.com/MetaMask/core/pull/4059))

## [9.0.1]

### Fixed

- Fix `types` field in `package.json` ([#4047](https://github.com/MetaMask/core/pull/4047))

## [9.0.0]

### Added

- **BREAKING**: Add ESM build ([#3998](https://github.com/MetaMask/core/pull/3998))
  - It's no longer possible to import files from `./dist` directly.

### Changed

- **BREAKING:** Bump peer dependency on `@metamask/approval-controller` to `^6.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
- **BREAKING:** Bump `@metamask/base-controller` to `^5.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
  - This version has a number of breaking changes. See the changelog for more.
- Bump `@metamask/controller-utils` to `^9.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))
- Bump `@metamask/json-rpc-engine` to `^8.0.0` ([#4039](https://github.com/MetaMask/core/pull/4039))

### Fixed

- **BREAKING:** Fix `SideEffectMessenger` so that it's defined with a `RestrictedControllerMessenger` that has access to `PermissionController` allowed actions ([#4031](https://github.com/MetaMask/core/pull/4031))
  - The messenger's `Action` generic parameter is widened to include the `PermissionController` actions allowlist.
  - The messenger's `AllowedAction` generic parameter is narrowed from `string` to the `PermissionController` actions allowlist.

## [8.0.1]

### Fixed

- Bump `@metamask/rpc-errors` to `^6.2.1` ([#3954](https://github.com/MetaMask/core/pull/3954), [#3970](https://github.com/MetaMask/core/pull/3970))

## [8.0.0]

### Changed

- **BREAKING:** Bump `@metamask/approval-controller` peer dependency to `^5.1.2` ([#3821](https://github.com/MetaMask/core/pull/3821))
- Bump `@metamask/utils` to `^8.3.0` ([#3769](https://github.com/MetaMask/core/pull/3769))
- Bump `@metamask/base-controller` to `^4.1.1` ([#3760](https://github.com/MetaMask/core/pull/3760), [#3821](https://github.com/MetaMask/core/pull/3821))
- Bump `@metamask/controller-utils` to `^8.0.2` ([#3821](https://github.com/MetaMask/core/pull/3821))
- Bump `@metamask/json-rpc-engine` to `^7.3.2` ([#3821](https://github.com/MetaMask/core/pull/3821))

## [7.1.0]

### Added

- Add `SubjectMetadataController:addSubjectMetadata` action ([#3733](https://github.com/MetaMask/core/pull/3733))

## [7.0.0]

### Changed

- **BREAKING:** Bump `@metamask/approval-controller` peer dependency from `^5.0.0` to `^5.1.1` ([#3680](https://github.com/MetaMask/core/pull/3680), [#3695](https://github.com/MetaMask/core/pull/3695))
- Bump `@metamask/base-controller` to `^4.0.1` ([#3695](https://github.com/MetaMask/core/pull/3695))
- Bump `@metamask/controller-utils` to `^8.0.1` ([#3695](https://github.com/MetaMask/core/pull/3695), [#3678](https://github.com/MetaMask/core/pull/3678), [#3667](https://github.com/MetaMask/core/pull/3667), [#3580](https://github.com/MetaMask/core/pull/3580))
- Bump `@metamask/json-rpc-engine` to `^7.3.1` ([#3695](https://github.com/MetaMask/core/pull/3695))

### Fixed

- Remove `@metamask/approval-controller` dependency ([#3607](https://github.com/MetaMask/core/pull/3607))

## [6.0.0]

### Added

- Add new handler to `permissionRpcMethods.handlers` for `wallet_revokePermissions` RPC method ([#1889](https://github.com/MetaMask/core/pull/1889))

### Changed

- **BREAKING:** Bump `@metamask/base-controller` to ^4.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))
  - This is breaking because the type of the `messenger` has backward-incompatible changes. See the changelog for this package for more.
- **BREAKING:** Update `PermittedRpcMethodHooks` type so it must support signature for `wallet_revokePermission` hook ([#1889](https://github.com/MetaMask/core/pull/1889))
- Bump `@metamask/approval-controller` to ^5.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))
- Bump `@metamask/controller-utils` to ^6.0.0 ([#2063](https://github.com/MetaMask/core/pull/2063))

## [5.0.1]

### Changed

- Bump `@metamask/json-rpc-engine` from `^7.1.0` to `^7.2.0` ([#1895](https://github.com/MetaMask/core/pull/1895))
- Bump dependency on `@metamask/rpc-errors` to ^6.1.0 ([#1653](https://github.com/MetaMask/core/pull/1653))
- Bump dependency and peer dependency on `@metamask/approval-controller` to ^4.0.1
- Bump `@metamask/utils` from `8.1.0` to `8.2.0` ([#1957](https://github.com/MetaMask/core/pull/1957))
- Bump `@metamask/auto-changelog` from `^3.2.0` to `^3.4.3` ([#1870](https://github.com/MetaMask/core/pull/1870), [#1905](https://github.com/MetaMask/core/pull/1905), [#1997](https://github.com/MetaMask/core/pull/1997))

## [5.0.0]

### Changed

- **BREAKING:** Remove `undefined` from RestrictedMethodParameters type union and from type parameter for RestrictedMethodOptions ([#1749](https://github.com/MetaMask/core/pull/1749))
- **BREAKING:** Update from `json-rpc-engine@^6.1.0` to `@metamask/json-rpc-engine@^7.1.1` ([#1749](https://github.com/MetaMask/core/pull/1749))
- Update from `eth-rpc-errors@^4.0.2` to `@metamask/rpc-errors@^6.0.0` ([#1749](https://github.com/MetaMask/core/pull/1749))
- Bump dependency on `@metamask/utils` to ^8.1.0 ([#1639](https://github.com/MetaMask/core/pull/1639))
- Bump dependency and peer dependency on `@metamask/approval-controller` to ^4.0.0
- Bump dependency on `@metamask/base-controller` to ^3.2.3
- Bump dependency on `@metamask/controller-utils` to ^5.0.2

## [4.1.2]

### Changed

- Update TypeScript to v4.8.x ([#1718](https://github.com/MetaMask/core/pull/1718))
- Bump dependency on `@metamask/controller-utils` to ^5.0.0

## [4.1.1]

### Changed

- Bump dependency and peer dependency on `@metamask/approval-controller` to ^3.5.1
- Bump dependency on `@metamask/base-controller` to ^3.2.1
- Bump dependency on `@metamask/controller-utils` to ^4.3.2

## [4.1.0]

### Changed

- Update `@metamask/utils` to `^6.2.0` ([#1514](https://github.com/MetaMask/core/pull/1514))

## [4.0.1]

### Fixed

- Fix permissions RPC method types ([#1464](https://github.com/MetaMask/core/pull/1464))
  - The RPC method handlers were mistakenly typed as an array rather than a tuple

## [4.0.0]

### Changed

- **BREAKING:** Bump to Node 16 ([#1262](https://github.com/MetaMask/core/pull/1262))
- **BREAKING:** Update `@metamask/approval-controller` dependency and peer dependency
- The export `permissionRpcMethods` has a slightly different type; the second generic type variable of the `getPermissions` handler is now `undefined` rather than `void` ([#1372](https://github.com/MetaMask/core/pull/1372))
- Add `@metamask/utils` dependency ([#1275](https://github.com/MetaMask/core/pull/1275))
- Remove `@metamask/types` dependency ([#1372](https://github.com/MetaMask/core/pull/1372))
- Change type of constructor parameter `unrestrictedMethods` to be readonly ([#1395](https://github.com/MetaMask/core/pull/1395))

### Removed

- **BREAKING**: Remove namespaced permissions ([#1337](https://github.com/MetaMask/core/pull/1337))
  - Namespaced permissions are no longer supported. Consumers should replace namespaced permissions with equivalent caveat-based implementations.
- **BREAKING**: Remove `targetKey` concept ([#1337](https://github.com/MetaMask/core/pull/1337))
  - The target key/name distinction only existed to support namespaced permissions, which are removed as of this release. Henceforth, permissions only have "names".
  - The `targetKey` property of permission specifications has been renamed to `targetName`.

## [3.2.0]

### Added

- Allow restricting permissions by subject type ([#1233](https://github.com/MetaMask/core/pull/1233))

### Changed

- Move `SubjectMetadataController` to permission-controller package ([#1234](https://github.com/MetaMask/core/pull/1234))
- Update minimum `eth-rpc-errors` version from `4.0.0` to `4.0.2` ([#1215](https://github.com/MetaMask/core/pull/1215))

## [3.1.0]

### Added

- Add side-effects to permissions ([#1069](https://github.com/MetaMask/core/pull/1069))

## [3.0.0]

### Removed

- **BREAKING:** Remove `isomorphic-fetch` ([#1106](https://github.com/MetaMask/controllers/pull/1106))
  - Consumers must now import `isomorphic-fetch` or another polyfill themselves if they are running in an environment without `fetch`

## [2.0.0]

### Added

- Add `updateCaveat` action ([#1071](https://github.com/MetaMask/core/pull/1071))

### Changed

- **BREAKING:** Update `@metamask/network-controller` peer dependency to v3 ([#1041](https://github.com/MetaMask/controllers/pull/1041))
- Rename this repository to `core` ([#1031](https://github.com/MetaMask/controllers/pull/1031))
- Update `@metamask/controller-utils` package ([#1041](https://github.com/MetaMask/controllers/pull/1041))

## [1.0.2]

### Fixed

- This package will now warn if a required package is not present ([#1003](https://github.com/MetaMask/core/pull/1003))

## [1.0.1]

### Changed

- Relax dependencies on `@metamask/approval-controller`, `@metamask/base-controller` and `@metamask/controller-utils` (use `^` instead of `~`) ([#998](https://github.com/MetaMask/core/pull/998))

## [1.0.0]

### Added

- Initial release

  - As a result of converting our shared controllers repo into a monorepo ([#831](https://github.com/MetaMask/core/pull/831)), we've created this package from select parts of [`@metamask/controllers` v33.0.0](https://github.com/MetaMask/core/tree/v33.0.0), namely:

    - Everything in `src/permissions`

    All changes listed after this point were applied to this package following the monorepo conversion.

[Unreleased]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@11.0.6...HEAD
[11.0.6]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@11.0.5...@metamask/permission-controller@11.0.6
[11.0.5]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@11.0.4...@metamask/permission-controller@11.0.5
[11.0.4]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@11.0.3...@metamask/permission-controller@11.0.4
[11.0.3]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@11.0.2...@metamask/permission-controller@11.0.3
[11.0.2]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@11.0.1...@metamask/permission-controller@11.0.2
[11.0.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@11.0.0...@metamask/permission-controller@11.0.1
[11.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@10.0.1...@metamask/permission-controller@11.0.0
[10.0.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@10.0.0...@metamask/permission-controller@10.0.1
[10.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@9.1.1...@metamask/permission-controller@10.0.0
[9.1.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@9.1.0...@metamask/permission-controller@9.1.1
[9.1.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@9.0.2...@metamask/permission-controller@9.1.0
[9.0.2]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@9.0.1...@metamask/permission-controller@9.0.2
[9.0.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@9.0.0...@metamask/permission-controller@9.0.1
[9.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@8.0.1...@metamask/permission-controller@9.0.0
[8.0.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@8.0.0...@metamask/permission-controller@8.0.1
[8.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@7.1.0...@metamask/permission-controller@8.0.0
[7.1.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@7.0.0...@metamask/permission-controller@7.1.0
[7.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@6.0.0...@metamask/permission-controller@7.0.0
[6.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@5.0.1...@metamask/permission-controller@6.0.0
[5.0.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@5.0.0...@metamask/permission-controller@5.0.1
[5.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@4.1.2...@metamask/permission-controller@5.0.0
[4.1.2]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@4.1.1...@metamask/permission-controller@4.1.2
[4.1.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@4.1.0...@metamask/permission-controller@4.1.1
[4.1.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@4.0.1...@metamask/permission-controller@4.1.0
[4.0.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@4.0.0...@metamask/permission-controller@4.0.1
[4.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@3.2.0...@metamask/permission-controller@4.0.0
[3.2.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@3.1.0...@metamask/permission-controller@3.2.0
[3.1.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@3.0.0...@metamask/permission-controller@3.1.0
[3.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@2.0.0...@metamask/permission-controller@3.0.0
[2.0.0]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@1.0.2...@metamask/permission-controller@2.0.0
[1.0.2]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@1.0.1...@metamask/permission-controller@1.0.2
[1.0.1]: https://github.com/MetaMask/core/compare/@metamask/permission-controller@1.0.0...@metamask/permission-controller@1.0.1
[1.0.0]: https://github.com/MetaMask/core/releases/tag/@metamask/permission-controller@1.0.0
