# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [16.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` to `^23.0.0` ([#6213](https://github.com/MetaMask/core/pull/6213))

## [15.0.0]

### Added

- Add `BASE` chain to notification UI config in `ui/constants.ts` ([#6124](https://github.com/MetaMask/core/pull/6124))

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` to `^22.0.0` ([#6171](https://github.com/MetaMask/core/pull/6171))
- Update push notification utility `getChainSymbol` in `get-notification-message.ts` to use UI constants ([#6124](https://github.com/MetaMask/core/pull/6124))

### Removed

- **BREAKING:** Cleanup old config/constants ([#6124](https://github.com/MetaMask/core/pull/6124))
  - Remove `NOTIFICATION_CHAINS` constant from `notification-schema.ts`
  - Remove `CHAIN_SYMBOLS` constant from `notification-schema.ts`
  - Remove `SUPPORTED_CHAINS` constant from `notification-schema.ts`
  - Remove `Trigger` type from `notification-schema.ts`
  - Remove `TRIGGERS` constant from `notification-schema.ts`

## [14.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` to `^21.0.0` ([#6100](https://github.com/MetaMask/core/pull/6100))

## [13.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` to `^20.0.0` ([#6071](https://github.com/MetaMask/core/pull/6071))

## [12.0.1]

### Changed

- Bump `@metamask/controller-utils` from `^11.10.0` to `^11.11.0` ([#6069](https://github.com/MetaMask/core/pull/6069))
  - This upgrade includes performance improvements to checksum hex address normalization
- Bump `@metamask/utils` from `^11.2.0` to `^11.4.2` ([#6054](https://github.com/MetaMask/core/pull/6054))

## [12.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` to `^19.0.0` ([#5999](https://github.com/MetaMask/core/pull/5999))

## [11.0.0]

### Added

- SEI network to supported networks for notifications ([#5945](https://github.com/MetaMask/core/pull/5945))
  - Added `SEI` to `NOTIFICATION_CHAINS_ID` constant
  - Added `Sei Network` to default `NOTIFICATION_NETWORK_CURRENCY_NAME` constant
  - Added `SEI` to default `NOTIFICATION_NETWORK_CURRENCY_SYMBOL` constant
  - Added SEI block explorer to default `SUPPORTED_NOTIFICATION_BLOCK_EXPLORERS` constant

### Changed

- **BREAKING:** bump `@metamask/profile-sync-controller` peer dependency to `^18.0.0` ([#5996](https://github.com/MetaMask/core/pull/5996))
- **BREAKING:** Migrated to notification v2 endpoints ([#5945](https://github.com/MetaMask/core/pull/5945))

  - `https://trigger.api.cx.metamask.io/api/v1` to `https://trigger.api.cx.metamask.io/api/v2` for managing out notification subscriptions
  - `https://notification.api.cx.metamask.io/api/v1` to `https://notification.api.cx.metamask.io/api/v2` for fetching notifications (in-app notifications)
  - `https://push.api.cx.metamask.io/v1` to `https://push.api.cx.metamask.io/v2` for subscribing push notifications
  - Renamed method `updateOnChainTriggersByAccount` to `enableAccounts` in `NotificationServicesController`
  - Renamed method `deleteOnChainTriggersByAccount` to `disableAccounts` in `NotificationServicesController`
  - Deprecated `updateTriggerPushNotifications` from `NotificationServicesPushController` and will be removed in a subsequent release.

- Bump `@metamask/controller-utils` to `^11.10.0` ([#5935](https://github.com/MetaMask/core/pull/5935))

### Removed

- **BREAKING:** Migrated to notification v2 endpoints ([#5945](https://github.com/MetaMask/core/pull/5945))

  - removed `NotificationServicesPushController:updateTriggerPushNotifications` action from `NotificationServicesController`
  - removed `UserStorageController:getStorageKey` action from `NotificationServicesController`
  - removed `UserStorageController:performGetStorage` action from `NotificationServicesController`
  - removed `UserStorageController:performSetStorage` action from `NotificationServicesController`
  - removed UserStorage notification utilities: `initializeUserStorage`, `cleanUserStorage`, `traverseUserStorageTriggers`, `checkAccountsPresence`, `inferEnabledKinds`, `getUUIDsForAccount`, `getAllUUIDs`, `getUUIDsForKinds`, `getUUIDsForAccountByKinds`, `upsertAddressTriggers`, `upsertTriggerTypeTriggers`, `toggleUserStorageTriggerStatus`.

## [10.0.0]

### Changed

- **BREAKING:** bump `@metamask/profile-sync-controller` peer dependency to `^17.0.0` ([#5906](https://github.com/MetaMask/core/pull/5906))

## [9.0.0]

### Changed

- **BREAKING:** bump `@metamask/profile-sync-controller` peer dependency to `^16.0.0` ([#5802](https://github.com/MetaMask/core/pull/5802))
- Bump `@metamask/controller-utils` to `^11.9.0` ([#5812](https://github.com/MetaMask/core/pull/5812))

## [8.0.0]

### Changed

- **BREAKING:** bump `@metamask/keyring-controller` peer dependency to `^22.0.0` ([#5802](https://github.com/MetaMask/core/pull/5802))
- **BREAKING:** bump `@metamask/profile-sync-controller` peer dependency to `^15.0.0` ([#5802](https://github.com/MetaMask/core/pull/5802))
- Bump peer dependency `@metamask/profile-sync-controller` to `^14.0.0` ([#5789](https://github.com/MetaMask/core/pull/5789))
  - While `@metamask/profile-sync-controller@14.0.0` contains breaking changes for clients, they are not breaking as a peer dependency here as the changes do not impact `@metamask/notification-services-controller`
- replaced `KeyringController:withKeyring` with `KeyringController:getState` to get the first HD keyring for notifications ([#5764](https://github.com/MetaMask/core/pull/5764))
- Bump `@metamask/controller-utils` to `^11.8.0` ([#5765](https://github.com/MetaMask/core/pull/5765))

### Removed

- **BREAKING** removed `KeyringController:withKeyring` allowed action in `NotificationServicesController` ([#5764](https://github.com/MetaMask/core/pull/5764))

## [7.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` to `^13.0.0` ([#5763](https://github.com/MetaMask/core/pull/5763))

## [6.0.1]

### Changed

- Bump `@metamask/base-controller` from ^8.0.0 to ^8.0.1 ([#5722](https://github.com/MetaMask/core/pull/5722))

### Fixed

- add a check inside the `KeyringController:stateChange` subscription inside `NotificationServicesController` to prevent infinite updates ([#5731](https://github.com/MetaMask/core/pull/5731))
  - As we invoke a `KeyringController:withKeyring` inside the `KeyringController:stateChange` event subscription,
    we are causing many infinite updates which block other controllers from performing state updates.
  - We now check the size of keyrings from the `KeyringController:stateChange` to better assume when keyrings have been added

## [6.0.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` to `^12.0.0` ([#5644](https://github.com/MetaMask/core/pull/5644))
- Bump `@metamask/controller-utils` to `^11.7.0` ([#5583](https://github.com/MetaMask/core/pull/5583))

## [5.0.1]

### Fixed

- add guard if `KeyringController:withKeyring` fails when called in `NotificationServicesController` ([#5514](https://github.com/MetaMask/core/pull/5514))

## [5.0.0]

### Changed

- Bump peer dependency `@metamask/profile-sync-controller` to `^11.0.0` ([#5507](https://github.com/MetaMask/core/pull/5507))

## [4.0.0]

### Changed

- **BREAKING** split `NotificationServiceController` constructor and initialization methods ([#5504](https://github.com/MetaMask/core/pull/5504))
  - Now requires calling `.init()` to finalize initialization, making it compatible with the Modular Controller Initialization architecture.

### Fixed

- use `withKeyring` to get main keyring accounts for enabling notifications ([#5459](https://github.com/MetaMask/core/pull/5459))
- add support for fetching shared announcements cross platforms ([#5441](https://github.com/MetaMask/core/pull/5441))

## [3.0.0]

### Changed

- **BREAKING** Bump `@metamask/keyring-controller` peer dependency to `^21.0.0` ([#5439](https://github.com/MetaMask/core/pull/5439))
- **BREAKING** Bump `@metamask/profile-sync-controller` peer dependency to `^10.0.0` ([#5439](https://github.com/MetaMask/core/pull/5439))

## [2.0.0]

### Added

- Add support for locales on push notifications ([#5392](https://github.com/MetaMask/core/pull/5392))

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` peer dependency to `^20.0.0` ([#5426](https://github.com/MetaMask/core/pull/5426))
- **BREAKING:** Bump `@metamask/profile-sync-controller` peer dependency to `^9.0.0` ([#5426](https://github.com/MetaMask/core/pull/5426))

## [1.0.0]

### Added

- added new public methods `enablePushNotifications` and `disablePushNotification` on `NotificationServicesController` ([#5120](https://github.com/MetaMask/core/pull/5120))
- added `isPushEnabled` and `isUpdatingFCMToken` to `NotificationServicesPushController` state ([#5120](https://github.com/MetaMask/core/pull/5120))
- added `/push-services/web` subpath export to make it easier to import web helpers ([#5120](https://github.com/MetaMask/core/pull/5120))

### Changed

- **BREAKING**: updated `NotificationServicesPushController` constructor config to require a push interface ([#5120](https://github.com/MetaMask/core/pull/5120))
- Optimized API calls for creating push notification links ([#5358](https://github.com/MetaMask/core/pull/5358))
- Bump `@metamask/utils` from `^11.1.0` to `^11.2.0` ([#5301](https://github.com/MetaMask/core/pull/5301))

### Fixed

- only allow hex addresses when creating notifications ([#5343](https://github.com/MetaMask/core/pull/5343))

## [0.21.0]

### Added

- Lock conditional checks when initializing accounts inside the `NotificationServicesController` ([#5323](https://github.com/MetaMask/core/pull/5323))
- Accounts initialize call when the wallet is unlocked ([#5323](https://github.com/MetaMask/core/pull/5323))

### Changed

- **BREAKING:** Bump `@metamask/profile-sync-controller` peer dependency from `^7.0.0` to `^8.0.0` ([#5318](https://github.com/MetaMask/core/pull/5318))

## [0.20.1]

### Changed

- Bump `@metamask/base-controller` from `^7.1.1` to `^8.0.0` ([#5305](https://github.com/MetaMask/core/pull/5305))

## [0.20.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` from `^6.0.0` to `^7.0.0` ([#5292](https://github.com/MetaMask/core/pull/5292))

## [0.19.0]

### Changed

- Improve logic & dependencies between profile sync, auth, user storage & notifications ([#5275](https://github.com/MetaMask/core/pull/5275))
- Rename `ControllerMessenger` to `Messenger` ([#5242](https://github.com/MetaMask/core/pull/5242))
- Bump @metamask/utils to v11.1.0 ([#5223](https://github.com/MetaMask/core/pull/5223))

## [0.18.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` from `^4.0.0` to `^5.0.0` ([#5218](https://github.com/MetaMask/core/pull/5218))

## [0.17.0]

### Changed

- Bump `firebase` from `^10.11.0` to `^11.2.0` ([#5196](https://github.com/MetaMask/core/pull/5196))

## [0.16.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` from `^3.0.0` to `^4.0.0` ([#5140](https://github.com/MetaMask/core/pull/5140))
- Bump `@metamask/base-controller` from `^7.0.0` to `^7.1.0` ([#5079](https://github.com/MetaMask/core/pull/5079))

## [0.15.0]

### Changed

- **BREAKING:** Bump peer dependency `@metamask/profile-sync-controller` from `^2.0.0` to `^3.0.0` ([#5012](https://github.com/MetaMask/core/pull/5012))
- Bump `@metamask/controller-utils` from `^11.4.3` to `^11.4.4` ([#5012](https://github.com/MetaMask/core/pull/5012))

### Fixed

- Correct ESM-compatible build so that imports of the following packages that re-export other modules via `export *` are no longer corrupted: ([#5011](https://github.com/MetaMask/core/pull/5011))
  - `loglevel`
  - `nock`

## [0.14.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` peer dependency from `^18.0.0` to `^19.0.0` ([#4195](https://github.com/MetaMask/core/pull/4956))
- **BREAKING:** Bump `@metamask/profile-sync-controller` peer dependency from `^1.0.0` to `^2.0.0` ([#4195](https://github.com/MetaMask/core/pull/4956))

## [0.13.0]

### Changed

- **BREAKING:** Bump `@metamask/keyring-controller` peer dependency from `^17.0.0` to `^18.0.0` ([#4195](https://github.com/MetaMask/core/pull/4195))
- **BREAKING:** Bump `@metamask/profile-sync-controller` peer dependency from `^0.9.7` to `^1.0.0` ([#4902](https://github.com/MetaMask/core/pull/4902))
- Bump `@metamask/controller-utils` from `^11.4.2` to `^11.4.3` ([#4195](https://github.com/MetaMask/core/pull/4195))

## [0.12.1]

### Changed

- chore: Bump `@metamask/utils` from `^9.1.0` to `^10.0.0` ([#4831](https://github.com/MetaMask/core/pull/4831))

### Fixed

- fix: allow snap notifications to be visible when controller is disabled ([#4890](https://github.com/MetaMask/core/pull/4890))
  - Most notification services are switched off when the controller is disabled, but since snaps are "local notifications", they need to be visible irrespective to the controller disabled state.

## [0.12.0]

### Added

- Export snap types ([#4836](https://github.com/MetaMask/core/pull/4836))

### Fixed

- fix: add publish event in `deleteNotificationsById` ([#4836](https://github.com/MetaMask/core/pull/4836))

## [0.11.0]

### Added

- Added support for an optional FCM token parameter for push notifications on mobile platforms, allowing native handling of FCM token creation through the Firebase SDK ([#4823](https://github.com/MetaMask/core/pull/4823))

### Changed

- update the types described in `types/on-chain-notification/schema` and `types/on-chain-notification/on-chain-notification` ([#4818](https://github.com/MetaMask/core/pull/4818))

  - adds new notifications: aave_v3_health_factor; ens_expiration; lido_staking_rewards; notional_loan_expiration; rocketpool_staking_rewards; spark_fi_health_factor
  - splits Wallet Notifications from Web 3 Notifications

- updated and added new notification mocks ([#4818](https://github.com/MetaMask/core/pull/4818))
  - can be accessed through `@metamask/notification-services-controller/notification-services/mocks`

### Fixed

- made `updateMetamaskNotificationsList` function work correctly by making the message handler async and moving the publish call outside of the update function. This ensures the `NotificationServicesController:notificationsListUpdated` event is received by the extension ([#4826](https://github.com/MetaMask/core/pull/4826))

## [0.10.0]

### Added

- added the ability for the `fetchFeatureAnnouncementNotifications` function, within the `notification-services-controller`, to fetch draft content from Contentful. This is made possible by passing a `previewToken` parameter ([#4790](https://github.com/MetaMask/core/pull/4790))

### Changed

- update `createMockNotification` functions to provide more realistic data for use in tests and component rendering in Storybook ([#4791](https://github.com/MetaMask/core/pull/4791))

## [0.9.0]

### Added

- Add new functions to create mock notifications ([#4780](https://github.com/MetaMask/core/pull/4780))
  - `createMockNotificationAaveV3HealthFactor`: this function generates a mock notification related to the health factor of an Aave V3 position
  - `createMockNotificationEnsExpiration`: this function creates a mock notification for the expiration of an ENS (Ethereum Name Service) domain
  - `createMockNotificationLidoStakingRewards`: this function produces a mock notification for Lido staking rewards
  - `createMockNotificationNotionalLoanExpiration`: this function generates a mock notification for the expiration of a Notional loan
  - `createMockNotificationSparkFiHealthFactor`: This function produces a mock notification related to the health factor of a SparkFi position

## [0.8.2]

### Added

- Add `resetNotifications` option during the notification creation flow ([#4738](https://github.com/MetaMask/core/pull/4738))

## [0.8.1]

### Changed

- Bump `@metamask/keyring-controller` from `^17.2.1` to `^17.2.2`. ([#4731](https://github.com/MetaMask/core/pull/4731))
- Bump `@metamask/profile-sync-controller` from `^0.9.1` to `^0.9.2`. ([#4731](https://github.com/MetaMask/core/pull/4731))

## [0.8.0]

### Changed

- Update UI export from MATIC to POL ([#4720](https://github.com/MetaMask/core/pull/4720))
- Bump `@metamask/profile-sync-controller` from `^0.8.0` to `^0.8.1` ([#4722]https://github.com/MetaMask/core/pull/4720)

## [0.7.0]

### Changed

- Bump `@metamask/profile-sync-controller` from `^0.7.0` to `^0.8.0` ([#4712](https://github.com/MetaMask/core/pull/4712))

### Fixed

- **BREAKING** use new profile-sync notification settings path hash ([#4711](https://github.com/MetaMask/core/pull/4711))
  - changing this path also means the underlying storage hash has changed. But this will align with our existing solutions that are in prod.

## [0.6.0]

### Changed

- update subpath exports to use new .d.cts definition files. ([#4709](https://github.com/MetaMask/core/pull/4709))
- Bump `@metamask/profile-sync-controller` from `^0.6.0` to `^0.7.0` ([#4710](https://github.com/MetaMask/core/pull/4710))

## [0.5.1]

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

## [0.5.0]

### Changed

- move contentful as a dev dependency ([#4673](https://github.com/MetaMask/core/pull/4673))
- update polygon symbol from MATIC to POL ([#4672](https://github.com/MetaMask/core/pull/4672))
- Bump `@metamask/profile-sync-controller` from `^0.4.0` to `^0.5.0` ([#4678](https://github.com/MetaMask/core/pull/4678))

## [0.4.1]

### Fixed

- fix: keep push subscription when wallet is locked ([#4653](https://github.com/MetaMask/core/pull/4653))
  - add `NotificationServicesPushController:subscribeToPushNotifications` event and allowedEvent in `NotificationServicesController`
  - add else check to continue to subscribe to push notifications when wallet is locked

## [0.4.0]

### Changed

- Bump `@metamask/profile-sync-controller` from `^0.3.0` to `^0.4.0` ([#4661](https://github.com/MetaMask/core/pull/4661))

## [0.3.0]

### Added

- passed notification parameter to the `NotificationServicesPushController` `onPushNotificationClicked` config ([#4613](https://github.com/MetaMask/core/pull/4613))
- Define and export new type `NotificationServicesControllerGetStateAction` ([#4633](https://github.com/MetaMask/core/pull/4633))
- Add and export types `NotificationServicesPushControllerGetStateAction`, `NotificationServicesPushControllerStateChangeEvent` ([#4641](https://github.com/MetaMask/core/pull/4641))
- add subpath exports to `@metamask/notification-services-controller` ([#4604](https://github.com/MetaMask/core/pull/4604))
  - add `@metamask/notification-services-controller/notification-services` export
  - add `@metamask/notification-services-controller/push-services` export
- add `TypeExternalLinkFields`, `TypePortfolioLinkFields`, and `TypeMobileLinkFields` types to handle different types of links in feature announcements ([#4620](https://github.com/MetaMask/core/pull/4620))

### Changed

- Bump `typescript` from `~5.1.6` to `~5.2.2` ([#4584](https://github.com/MetaMask/core/pull/4584))
- Bump `@metamask/profile-sync-controller` from `^0.2.1` to `^0.3.0` ([#4657](https://github.com/MetaMask/core/pull/4657))
- Bump `contentful` from `^10.3.6` to `^10.15.0` ([#4637](https://github.com/MetaMask/core/pull/4637))
- **BREAKING:** Rename `NotificationServicesPushControllerPushNotificationClicked` type to `NotificationServicesPushControllerPushNotificationClickedEvent` ([#4641](https://github.com/MetaMask/core/pull/4641))
- **BREAKING:** Narrow `AllowedEvents` type for `NotificationServicesPushControllerMessenger` to `never` ([#4641](https://github.com/MetaMask/core/pull/4641))
- updated `NotificationServicesPushControllerMessenger` must allow internal event `NotificationServicesPushControllerStateChangeEvent` ([#4641](https://github.com/MetaMask/core/pull/4641))
- updated `FeatureAnnouncementRawNotificationData` to include fields for external, portfolio, and mobile links ([#4620](https://github.com/MetaMask/core/pull/4620))
- updated `TypeFeatureAnnouncementFields` to include fields for external, portfolio, and mobile links ([#4620](https://github.com/MetaMask/core/pull/4620))
- updated `fetchFeatureAnnouncementNotifications` to handle the new link types and include them in the notification data.

### Fixed

- Replace `getState` action in `NotificationServicesControllerActions` with correctly-defined `NotificationServicesControllerGetStateAction` type ([#4633](https://github.com/MetaMask/core/pull/4633))
- **BREAKING:** Fix package-level export for `NotificationServicesPushController` from "NotificationsServicesPushController" to "NotificationsServicesPushController" ([#4641](https://github.com/MetaMask/core/pull/4641))
- **BREAKING:** Replace incorrectly-defined `getState` action in the `Actions` type for `NotificationServicesPushControllerMessenger` with new `NotificationServicesPushControllerGetStateAction` type ([#4641](https://github.com/MetaMask/core/pull/4641))
- update subpath exports internal `package.json` files to resolve `jest-haste-map` errors ([#4650](https://github.com/MetaMask/core/pull/4650))
- removed unnecessary subpath exports ([#4650](https://github.com/MetaMask/core/pull/4650))
  - removed `/constants`, `/services`, `/processors`, `/utils` sub paths as these are navigable from root.

## [0.2.1]

### Added

- new controller events when notifications list is updated or notifications are read ([#4573](https://github.com/MetaMask/core/pull/4573))
- unlock checks for when controller methods are called ([#4569](https://github.com/MetaMask/core/pull/4569))

### Changed

- updated controller event type names ([#4592](https://github.com/MetaMask/core/pull/4592))
- Bump `typescript` from `~5.0.4` to `~5.1.6` ([#4576](https://github.com/MetaMask/core/pull/4576))

## [0.2.0]

### Added

- Add and export type `BlockExplorerConfig` and object `SUPPORTED_NOTIFICATION_BLOCK_EXPLORERS`, which is a collection of block explorers for chains on which notifications are supported ([#4552](https://github.com/MetaMask/core/pull/4552))

### Changed

- **BREAKING:** Bump peerDependency `@metamask/profile-sync-controller` from `^0.1.4` to `^0.2.0` ([#4548](https://github.com/MetaMask/core/pull/4548))
- Remove `@metamask/keyring-controller` and `@metamask/profile-sync-controller` dependencies [#4556](https://github.com/MetaMask/core/pull/4556)
  - These were listed under `peerDependencies` already, so they were redundant as dependencies.
- Upgrade TypeScript version to `~5.0.4` and set `moduleResolution` option to `Node16` ([#3645](https://github.com/MetaMask/core/pull/3645))
- Bump `@metamask/base-controller` from `^6.0.1` to `^6.0.2` ([#4544](https://github.com/MetaMask/core/pull/4544))
- Bump `@metamask/controller-utils` from `^11.0.1` to `^11.0.2` ([#4544](https://github.com/MetaMask/core/pull/4544))

## [0.1.2]

### Added

- added catch statements in NotificationServicesController to silently fail push notifications ([#4536](https://github.com/MetaMask/core/pull/4536))

- added checks to see feature announcement environments before fetching announcements ([#4530](https://github.com/MetaMask/core/pull/4530))

### Removed

- removed retries when fetching announcements and wallet notifications. Clients are to handle retries now. ([#4531](https://github.com/MetaMask/core/pull/4531))

## [0.1.1]

### Added

- export `defaultState` for `NotificationServicesController` and `NotificationServicesPushController`. ([#4441](https://github.com/MetaMask/core/pull/4441))

- export `NOTIFICATION_CHAINS_ID` which is a const-asserted version of `NOTIFICATION_CHAINS` ([#4441](https://github.com/MetaMask/core/pull/4441))

- export `NOTIFICATION_NETWORK_CURRENCY_NAME` and `NOTIFICATION_NETWORK_CURRENCY_SYMBOL`. Allows consistent currency names and symbols for supported notification services ([#4441](https://github.com/MetaMask/core/pull/4441))

- add `isPushIntegrated` as an optional env property in the `NotificationServicesController` constructor (defaults to true) ([#4441](https://github.com/MetaMask/core/pull/4441))

### Fixed

- `NotificationServicesPushController` - removed global `self` calls for mobile compatibility ([#4441](https://github.com/MetaMask/core/pull/4441))

## [0.1.0]

### Added

- Initial release

[Unreleased]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@16.0.0...HEAD
[16.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@15.0.0...@metamask/notification-services-controller@16.0.0
[15.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@14.0.0...@metamask/notification-services-controller@15.0.0
[14.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@13.0.0...@metamask/notification-services-controller@14.0.0
[13.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@12.0.1...@metamask/notification-services-controller@13.0.0
[12.0.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@12.0.0...@metamask/notification-services-controller@12.0.1
[12.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@11.0.0...@metamask/notification-services-controller@12.0.0
[11.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@10.0.0...@metamask/notification-services-controller@11.0.0
[10.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@9.0.0...@metamask/notification-services-controller@10.0.0
[9.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@8.0.0...@metamask/notification-services-controller@9.0.0
[8.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@7.0.0...@metamask/notification-services-controller@8.0.0
[7.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@6.0.1...@metamask/notification-services-controller@7.0.0
[6.0.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@6.0.0...@metamask/notification-services-controller@6.0.1
[6.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@5.0.1...@metamask/notification-services-controller@6.0.0
[5.0.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@5.0.0...@metamask/notification-services-controller@5.0.1
[5.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@4.0.0...@metamask/notification-services-controller@5.0.0
[4.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@3.0.0...@metamask/notification-services-controller@4.0.0
[3.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@2.0.0...@metamask/notification-services-controller@3.0.0
[2.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@1.0.0...@metamask/notification-services-controller@2.0.0
[1.0.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.21.0...@metamask/notification-services-controller@1.0.0
[0.21.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.20.1...@metamask/notification-services-controller@0.21.0
[0.20.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.20.0...@metamask/notification-services-controller@0.20.1
[0.20.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.19.0...@metamask/notification-services-controller@0.20.0
[0.19.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.18.0...@metamask/notification-services-controller@0.19.0
[0.18.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.17.0...@metamask/notification-services-controller@0.18.0
[0.17.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.16.0...@metamask/notification-services-controller@0.17.0
[0.16.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.15.0...@metamask/notification-services-controller@0.16.0
[0.15.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.14.0...@metamask/notification-services-controller@0.15.0
[0.14.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.13.0...@metamask/notification-services-controller@0.14.0
[0.13.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.12.1...@metamask/notification-services-controller@0.13.0
[0.12.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.12.0...@metamask/notification-services-controller@0.12.1
[0.12.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.11.0...@metamask/notification-services-controller@0.12.0
[0.11.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.10.0...@metamask/notification-services-controller@0.11.0
[0.10.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.9.0...@metamask/notification-services-controller@0.10.0
[0.9.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.8.2...@metamask/notification-services-controller@0.9.0
[0.8.2]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.8.1...@metamask/notification-services-controller@0.8.2
[0.8.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.8.0...@metamask/notification-services-controller@0.8.1
[0.8.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.7.0...@metamask/notification-services-controller@0.8.0
[0.7.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.6.0...@metamask/notification-services-controller@0.7.0
[0.6.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.5.1...@metamask/notification-services-controller@0.6.0
[0.5.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.5.0...@metamask/notification-services-controller@0.5.1
[0.5.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.4.1...@metamask/notification-services-controller@0.5.0
[0.4.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.4.0...@metamask/notification-services-controller@0.4.1
[0.4.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.3.0...@metamask/notification-services-controller@0.4.0
[0.3.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.2.1...@metamask/notification-services-controller@0.3.0
[0.2.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.2.0...@metamask/notification-services-controller@0.2.1
[0.2.0]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.1.2...@metamask/notification-services-controller@0.2.0
[0.1.2]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.1.1...@metamask/notification-services-controller@0.1.2
[0.1.1]: https://github.com/MetaMask/core/compare/@metamask/notification-services-controller@0.1.0...@metamask/notification-services-controller@0.1.1
[0.1.0]: https://github.com/MetaMask/core/releases/tag/@metamask/notification-services-controller@0.1.0
