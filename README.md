# Core Monorepo

This monorepo is a collection of packages used across multiple MetaMask clients (e.g. [`metamask-extension`](https://github.com/MetaMask/metamask-extension/), [`metamask-mobile`](https://github.com/MetaMask/metamask-mobile/)).

## Contributing

See the [Contributor Guide](./docs/contributing.md) for help on:

- Setting up your development environment
- Working with the monorepo
- Testing changes in clients
- Issuing new releases
- Creating a new package

## Installation/Usage

Each package in this repository has its own README where you can find installation and usage instructions. See `packages/` for more.

## Packages

<!-- start package list -->

- [`@metamask/account-tree-controller`](packages/account-tree-controller)
- [`@metamask/accounts-controller`](packages/accounts-controller)
- [`@metamask/address-book-controller`](packages/address-book-controller)
- [`@metamask/announcement-controller`](packages/announcement-controller)
- [`@metamask/app-metadata-controller`](packages/app-metadata-controller)
- [`@metamask/approval-controller`](packages/approval-controller)
- [`@metamask/assets-controllers`](packages/assets-controllers)
- [`@metamask/base-controller`](packages/base-controller)
- [`@metamask/bridge-controller`](packages/bridge-controller)
- [`@metamask/bridge-status-controller`](packages/bridge-status-controller)
- [`@metamask/build-utils`](packages/build-utils)
- [`@metamask/chain-agnostic-permission`](packages/chain-agnostic-permission)
- [`@metamask/composable-controller`](packages/composable-controller)
- [`@metamask/controller-utils`](packages/controller-utils)
- [`@metamask/delegation-controller`](packages/delegation-controller)
- [`@metamask/earn-controller`](packages/earn-controller)
- [`@metamask/eip1193-permission-middleware`](packages/eip1193-permission-middleware)
- [`@metamask/ens-controller`](packages/ens-controller)
- [`@metamask/error-reporting-service`](packages/error-reporting-service)
- [`@metamask/eth-json-rpc-provider`](packages/eth-json-rpc-provider)
- [`@metamask/foundryup`](packages/foundryup)
- [`@metamask/gas-fee-controller`](packages/gas-fee-controller)
- [`@metamask/json-rpc-engine`](packages/json-rpc-engine)
- [`@metamask/json-rpc-middleware-stream`](packages/json-rpc-middleware-stream)
- [`@metamask/keyring-controller`](packages/keyring-controller)
- [`@metamask/logging-controller`](packages/logging-controller)
- [`@metamask/message-manager`](packages/message-manager)
- [`@metamask/messenger`](packages/messenger)
- [`@metamask/multichain-account-service`](packages/multichain-account-service)
- [`@metamask/multichain-api-middleware`](packages/multichain-api-middleware)
- [`@metamask/multichain-network-controller`](packages/multichain-network-controller)
- [`@metamask/multichain-transactions-controller`](packages/multichain-transactions-controller)
- [`@metamask/name-controller`](packages/name-controller)
- [`@metamask/network-controller`](packages/network-controller)
- [`@metamask/notification-services-controller`](packages/notification-services-controller)
- [`@metamask/permission-controller`](packages/permission-controller)
- [`@metamask/permission-log-controller`](packages/permission-log-controller)
- [`@metamask/phishing-controller`](packages/phishing-controller)
- [`@metamask/polling-controller`](packages/polling-controller)
- [`@metamask/preferences-controller`](packages/preferences-controller)
- [`@metamask/profile-sync-controller`](packages/profile-sync-controller)
- [`@metamask/rate-limit-controller`](packages/rate-limit-controller)
- [`@metamask/remote-feature-flag-controller`](packages/remote-feature-flag-controller)
- [`@metamask/sample-controllers`](packages/sample-controllers)
- [`@metamask/seedless-onboarding-controller`](packages/seedless-onboarding-controller)
- [`@metamask/selected-network-controller`](packages/selected-network-controller)
- [`@metamask/signature-controller`](packages/signature-controller)
- [`@metamask/token-search-discovery-controller`](packages/token-search-discovery-controller)
- [`@metamask/transaction-controller`](packages/transaction-controller)
- [`@metamask/user-operation-controller`](packages/user-operation-controller)

<!-- end package list -->

<!-- start dependency graph -->

```mermaid
%%{ init: { 'flowchart': { 'curve': 'bumpX' } } }%%
graph LR;
linkStyle default opacity:0.5
  account_tree_controller(["@metamask/account-tree-controller"]);
  accounts_controller(["@metamask/accounts-controller"]);
  address_book_controller(["@metamask/address-book-controller"]);
  announcement_controller(["@metamask/announcement-controller"]);
  app_metadata_controller(["@metamask/app-metadata-controller"]);
  approval_controller(["@metamask/approval-controller"]);
  assets_controllers(["@metamask/assets-controllers"]);
  base_controller(["@metamask/base-controller"]);
  bridge_controller(["@metamask/bridge-controller"]);
  bridge_status_controller(["@metamask/bridge-status-controller"]);
  build_utils(["@metamask/build-utils"]);
  chain_agnostic_permission(["@metamask/chain-agnostic-permission"]);
  composable_controller(["@metamask/composable-controller"]);
  controller_utils(["@metamask/controller-utils"]);
  delegation_controller(["@metamask/delegation-controller"]);
  earn_controller(["@metamask/earn-controller"]);
  eip1193_permission_middleware(["@metamask/eip1193-permission-middleware"]);
  ens_controller(["@metamask/ens-controller"]);
  error_reporting_service(["@metamask/error-reporting-service"]);
  eth_json_rpc_provider(["@metamask/eth-json-rpc-provider"]);
  foundryup(["@metamask/foundryup"]);
  gas_fee_controller(["@metamask/gas-fee-controller"]);
  json_rpc_engine(["@metamask/json-rpc-engine"]);
  json_rpc_middleware_stream(["@metamask/json-rpc-middleware-stream"]);
  keyring_controller(["@metamask/keyring-controller"]);
  logging_controller(["@metamask/logging-controller"]);
  message_manager(["@metamask/message-manager"]);
  messenger(["@metamask/messenger"]);
  multichain_account_service(["@metamask/multichain-account-service"]);
  multichain_api_middleware(["@metamask/multichain-api-middleware"]);
  multichain_network_controller(["@metamask/multichain-network-controller"]);
  multichain_transactions_controller(["@metamask/multichain-transactions-controller"]);
  name_controller(["@metamask/name-controller"]);
  network_controller(["@metamask/network-controller"]);
  notification_services_controller(["@metamask/notification-services-controller"]);
  permission_controller(["@metamask/permission-controller"]);
  permission_log_controller(["@metamask/permission-log-controller"]);
  phishing_controller(["@metamask/phishing-controller"]);
  polling_controller(["@metamask/polling-controller"]);
  preferences_controller(["@metamask/preferences-controller"]);
  profile_sync_controller(["@metamask/profile-sync-controller"]);
  rate_limit_controller(["@metamask/rate-limit-controller"]);
  remote_feature_flag_controller(["@metamask/remote-feature-flag-controller"]);
  sample_controllers(["@metamask/sample-controllers"]);
  seedless_onboarding_controller(["@metamask/seedless-onboarding-controller"]);
  selected_network_controller(["@metamask/selected-network-controller"]);
  signature_controller(["@metamask/signature-controller"]);
  token_search_discovery_controller(["@metamask/token-search-discovery-controller"]);
  transaction_controller(["@metamask/transaction-controller"]);
  user_operation_controller(["@metamask/user-operation-controller"]);
  account_tree_controller --> base_controller;
  account_tree_controller --> accounts_controller;
  account_tree_controller --> keyring_controller;
  accounts_controller --> base_controller;
  accounts_controller --> keyring_controller;
  accounts_controller --> network_controller;
  address_book_controller --> base_controller;
  address_book_controller --> controller_utils;
  announcement_controller --> base_controller;
  app_metadata_controller --> base_controller;
  approval_controller --> base_controller;
  assets_controllers --> base_controller;
  assets_controllers --> controller_utils;
  assets_controllers --> polling_controller;
  assets_controllers --> accounts_controller;
  assets_controllers --> approval_controller;
  assets_controllers --> keyring_controller;
  assets_controllers --> network_controller;
  assets_controllers --> permission_controller;
  assets_controllers --> phishing_controller;
  assets_controllers --> preferences_controller;
  assets_controllers --> transaction_controller;
  base_controller --> json_rpc_engine;
  bridge_controller --> base_controller;
  bridge_controller --> controller_utils;
  bridge_controller --> gas_fee_controller;
  bridge_controller --> multichain_network_controller;
  bridge_controller --> polling_controller;
  bridge_controller --> accounts_controller;
  bridge_controller --> assets_controllers;
  bridge_controller --> eth_json_rpc_provider;
  bridge_controller --> network_controller;
  bridge_controller --> remote_feature_flag_controller;
  bridge_controller --> transaction_controller;
  bridge_status_controller --> base_controller;
  bridge_status_controller --> controller_utils;
  bridge_status_controller --> polling_controller;
  bridge_status_controller --> accounts_controller;
  bridge_status_controller --> bridge_controller;
  bridge_status_controller --> gas_fee_controller;
  bridge_status_controller --> network_controller;
  bridge_status_controller --> transaction_controller;
  chain_agnostic_permission --> controller_utils;
  chain_agnostic_permission --> network_controller;
  chain_agnostic_permission --> permission_controller;
  composable_controller --> base_controller;
  composable_controller --> json_rpc_engine;
  delegation_controller --> base_controller;
  delegation_controller --> accounts_controller;
  delegation_controller --> keyring_controller;
  earn_controller --> base_controller;
  earn_controller --> controller_utils;
  earn_controller --> accounts_controller;
  earn_controller --> network_controller;
  earn_controller --> transaction_controller;
  eip1193_permission_middleware --> chain_agnostic_permission;
  eip1193_permission_middleware --> controller_utils;
  eip1193_permission_middleware --> json_rpc_engine;
  eip1193_permission_middleware --> permission_controller;
  ens_controller --> base_controller;
  ens_controller --> controller_utils;
  ens_controller --> network_controller;
  error_reporting_service --> base_controller;
  eth_json_rpc_provider --> json_rpc_engine;
  gas_fee_controller --> base_controller;
  gas_fee_controller --> controller_utils;
  gas_fee_controller --> polling_controller;
  gas_fee_controller --> network_controller;
  json_rpc_middleware_stream --> json_rpc_engine;
  keyring_controller --> base_controller;
  logging_controller --> base_controller;
  logging_controller --> controller_utils;
  message_manager --> base_controller;
  message_manager --> controller_utils;
  multichain_account_service --> base_controller;
  multichain_account_service --> accounts_controller;
  multichain_account_service --> keyring_controller;
  multichain_api_middleware --> chain_agnostic_permission;
  multichain_api_middleware --> controller_utils;
  multichain_api_middleware --> json_rpc_engine;
  multichain_api_middleware --> network_controller;
  multichain_api_middleware --> permission_controller;
  multichain_api_middleware --> multichain_transactions_controller;
  multichain_network_controller --> base_controller;
  multichain_network_controller --> controller_utils;
  multichain_network_controller --> accounts_controller;
  multichain_network_controller --> keyring_controller;
  multichain_network_controller --> network_controller;
  multichain_transactions_controller --> base_controller;
  multichain_transactions_controller --> polling_controller;
  multichain_transactions_controller --> accounts_controller;
  multichain_transactions_controller --> keyring_controller;
  name_controller --> base_controller;
  name_controller --> controller_utils;
  network_controller --> base_controller;
  network_controller --> controller_utils;
  network_controller --> eth_json_rpc_provider;
  network_controller --> json_rpc_engine;
  network_controller --> error_reporting_service;
  notification_services_controller --> base_controller;
  notification_services_controller --> controller_utils;
  notification_services_controller --> keyring_controller;
  notification_services_controller --> profile_sync_controller;
  permission_controller --> base_controller;
  permission_controller --> controller_utils;
  permission_controller --> json_rpc_engine;
  permission_controller --> approval_controller;
  permission_log_controller --> base_controller;
  permission_log_controller --> json_rpc_engine;
  phishing_controller --> base_controller;
  phishing_controller --> controller_utils;
  polling_controller --> base_controller;
  polling_controller --> controller_utils;
  polling_controller --> network_controller;
  preferences_controller --> base_controller;
  preferences_controller --> controller_utils;
  preferences_controller --> keyring_controller;
  profile_sync_controller --> base_controller;
  profile_sync_controller --> accounts_controller;
  profile_sync_controller --> keyring_controller;
  rate_limit_controller --> base_controller;
  remote_feature_flag_controller --> base_controller;
  remote_feature_flag_controller --> controller_utils;
  sample_controllers --> base_controller;
  sample_controllers --> controller_utils;
  sample_controllers --> network_controller;
  seedless_onboarding_controller --> base_controller;
  seedless_onboarding_controller --> keyring_controller;
  selected_network_controller --> base_controller;
  selected_network_controller --> json_rpc_engine;
  selected_network_controller --> network_controller;
  selected_network_controller --> permission_controller;
  signature_controller --> base_controller;
  signature_controller --> controller_utils;
  signature_controller --> accounts_controller;
  signature_controller --> approval_controller;
  signature_controller --> keyring_controller;
  signature_controller --> logging_controller;
  signature_controller --> network_controller;
  token_search_discovery_controller --> base_controller;
  transaction_controller --> base_controller;
  transaction_controller --> controller_utils;
  transaction_controller --> accounts_controller;
  transaction_controller --> approval_controller;
  transaction_controller --> eth_json_rpc_provider;
  transaction_controller --> gas_fee_controller;
  transaction_controller --> network_controller;
  transaction_controller --> remote_feature_flag_controller;
  user_operation_controller --> base_controller;
  user_operation_controller --> controller_utils;
  user_operation_controller --> polling_controller;
  user_operation_controller --> approval_controller;
  user_operation_controller --> gas_fee_controller;
  user_operation_controller --> keyring_controller;
  user_operation_controller --> network_controller;
  user_operation_controller --> transaction_controller;
```

<!-- end dependency graph -->

(This section may be regenerated at any time by running `yarn update-readme-content`.)
