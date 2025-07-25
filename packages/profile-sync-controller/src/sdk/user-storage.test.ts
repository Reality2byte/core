import type { UserStorageGenericFeatureKey } from 'src/shared/storage-schema';

import { arrangeAuthAPIs } from './__fixtures__/auth';
import { arrangeAuth, typedMockFn } from './__fixtures__/test-utils';
import {
  handleMockUserStorageGet,
  handleMockUserStoragePut,
  handleMockUserStorageGetAllFeatureEntries,
  handleMockUserStorageDeleteAllFeatureEntries,
  handleMockUserStorageDelete,
  handleMockUserStorageBatchDelete,
} from './__fixtures__/userstorage';
import { type IBaseAuth } from './authentication-jwt-bearer/types';
import { NotFoundError, UserStorageError } from './errors';
import {
  MOCK_NOTIFICATIONS_DATA,
  MOCK_STORAGE_KEY,
  MOCK_STORAGE_RESPONSE,
} from './mocks/userstorage';
import type { StorageOptions } from './user-storage';
import { STORAGE_URL, UserStorage } from './user-storage';
import encryption, { createSHA256Hash } from '../shared/encryption';
import { SHARED_SALT } from '../shared/encryption/constants';
import { Env } from '../shared/env';
import { USER_STORAGE_FEATURE_NAMES } from '../shared/storage-schema';

const MOCK_SRP = '0x6265617665726275696c642e6f7267';
const MOCK_ADDRESS = '0x68757d15a4d8d1421c17003512AFce15D3f3FaDa';

describe('User Storage - STORAGE_URL()', () => {
  it('generates an example url path for User Storage', () => {
    const result = STORAGE_URL(Env.PRD, 'my-feature/my-hashed-entry');
    expect(result).toBeDefined();
    expect(result).toContain('my-feature');
    expect(result).toContain('my-hashed-entry');
  });
});

describe('User Storage', () => {
  it('get/set key using SRP', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    const mockPut = handleMockUserStoragePut();
    const mockGet = await handleMockUserStorageGet();

    // Test Set
    const data = MOCK_NOTIFICATIONS_DATA;
    await userStorage.setItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
      data,
    );
    expect(mockPut.isDone()).toBe(true);
    expect(mockGet.isDone()).toBe(false);

    // Test Get (we expect the mocked encrypted data to be decrypt-able with the given Mock Storage Key)
    const response = await userStorage.getItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
    );
    expect(mockGet.isDone()).toBe(true);
    expect(response).toBe(data);
  });

  it('get/set key using SiWE', async () => {
    const { auth, mockSignMessage } = arrangeAuth('SiWE', MOCK_ADDRESS);
    auth.prepare({
      address: MOCK_ADDRESS,
      chainId: 1,
      signMessage: mockSignMessage,
      domain: 'https://metamask.io',
    });

    const { userStorage } = arrangeUserStorage(auth);

    const mockPut = handleMockUserStoragePut();
    const mockGet = await handleMockUserStorageGet();

    // Test Set
    const data = MOCK_NOTIFICATIONS_DATA;
    await userStorage.setItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
      data,
    );
    expect(mockPut.isDone()).toBe(true);
    expect(mockGet.isDone()).toBe(false);

    // Test Get (we expect the mocked encrypted data to be decrypt-able with the given Mock Storage Key)
    const response = await userStorage.getItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
    );
    expect(mockGet.isDone()).toBe(true);
    expect(response).toBe(data);
  });

  it('re-encrypts data if received entry was encrypted with a random salt, and saves it back to user storage', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    // This corresponds to 'data1'
    // Encrypted with a random salt
    const mockResponse = {
      HashedKey: 'entry1',
      Data: '{"v":"1","t":"scrypt","d":"HIu+WgFBCtKo6rEGy0R8h8t/JgXhzC2a3AF6epahGY2h6GibXDKxSBf6ppxM099Gmg==","o":{"N":131072,"r":8,"p":1,"dkLen":16},"saltLen":16}',
    };

    const mockGet = await handleMockUserStorageGet({
      status: 200,
      body: JSON.stringify(mockResponse),
    });
    const mockPut = handleMockUserStoragePut(
      undefined,
      async (_, requestBody) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (typeof requestBody === 'string') {
          return;
        }

        const isEncryptedUsingSharedSalt =
          encryption.getSalt(requestBody.data).toString() ===
          SHARED_SALT.toString();

        expect(isEncryptedUsingSharedSalt).toBe(true);
      },
    );

    await userStorage.getItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
    );
    expect(mockGet.isDone()).toBe(true);
    expect(mockPut.isDone()).toBe(true);
  });

  it('gets all feature entries', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    const mockGetAll = await handleMockUserStorageGetAllFeatureEntries({
      status: 200,
      body: [
        await MOCK_STORAGE_RESPONSE(),
        {
          HashedKey: 'entry2',
        },
      ],
    });

    const data = MOCK_NOTIFICATIONS_DATA;
    const responseAllFeatureEntries = await userStorage.getAllFeatureItems(
      USER_STORAGE_FEATURE_NAMES.notifications,
    );
    expect(mockGetAll.isDone()).toBe(true);
    expect(responseAllFeatureEntries).toStrictEqual([data]);
  });

  it('re-encrypts data if received entries were encrypted with random salts, and saves it back to user storage', async () => {
    // This corresponds to [['entry1', 'data1'], ['entry2', 'data2'], ['HASHED_KEY', '{ "hello": "world" }']]
    // Each entry has been encrypted with a random salt, except for the last entry
    // The last entry is used to test if the function can handle payloads that contain both random salts and the shared salt
    const mockResponse = [
      {
        HashedKey: 'entry1',
        Data: '{"v":"1","t":"scrypt","d":"HIu+WgFBCtKo6rEGy0R8h8t/JgXhzC2a3AF6epahGY2h6GibXDKxSBf6ppxM099Gmg==","o":{"N":131072,"r":8,"p":1,"dkLen":16},"saltLen":16}',
      },
      {
        HashedKey: 'entry2',
        Data: '{"v":"1","t":"scrypt","d":"3ioo9bxhjDjTmJWIGQMnOlnfa4ysuUNeLYTTmJ+qrq7gwI6hURH3ooUcBldJkHtvuQ==","o":{"N":131072,"r":8,"p":1,"dkLen":16},"saltLen":16}',
      },
      await MOCK_STORAGE_RESPONSE('data3'),
    ];

    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    const mockGetAll = await handleMockUserStorageGetAllFeatureEntries({
      status: 200,
      body: mockResponse,
    });

    const mockPut = handleMockUserStoragePut(
      undefined,
      async (_, requestBody) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (typeof requestBody === 'string') {
          return;
        }

        const doEntriesHaveDifferentSalts =
          encryption.getIfEntriesHaveDifferentSalts(
            Object.entries(requestBody.data).map((entry) => entry[1] as string),
          );

        expect(doEntriesHaveDifferentSalts).toBe(false);

        const doEntriesUseSharedSalt = Object.entries(requestBody.data).every(
          ([_entryKey, entryValue]) =>
            encryption.getSalt(entryValue as string).toString() ===
            SHARED_SALT.toString(),
        );

        expect(doEntriesUseSharedSalt).toBe(true);

        const wereOnlyNonEmptySaltEntriesUploaded =
          Object.entries(requestBody.data).length === 2;

        expect(wereOnlyNonEmptySaltEntriesUploaded).toBe(true);
      },
    );

    await userStorage.getAllFeatureItems(
      USER_STORAGE_FEATURE_NAMES.notifications,
    );
    expect(mockGetAll.isDone()).toBe(true);
    expect(mockPut.isDone()).toBe(true);
  });

  it('batch set items', async () => {
    const dataToStore: [UserStorageGenericFeatureKey, string][] = [
      ['0x123', JSON.stringify(MOCK_NOTIFICATIONS_DATA)],
      ['0x456', JSON.stringify(MOCK_NOTIFICATIONS_DATA)],
    ];

    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    const mockPut = handleMockUserStoragePut(
      undefined,
      async (_, requestBody) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (typeof requestBody === 'string') {
          return;
        }

        const decryptedBody = await Promise.all(
          Object.entries<string>(requestBody.data).map(
            async ([entryKey, entryValue]) => {
              return [
                entryKey,
                await encryption.decryptString(entryValue, MOCK_STORAGE_KEY),
              ];
            },
          ),
        );

        const expectedBody = dataToStore.map(([entryKey, entryValue]) => [
          createSHA256Hash(String(entryKey) + MOCK_STORAGE_KEY),
          entryValue,
        ]);

        expect(decryptedBody).toStrictEqual(expectedBody);
      },
    );

    await userStorage.batchSetItems(
      USER_STORAGE_FEATURE_NAMES.accounts,
      dataToStore,
    );
    expect(mockPut.isDone()).toBe(true);
  });

  it('returns void when trying to batch set items with invalid data', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    expect(
      await userStorage.batchSetItems(USER_STORAGE_FEATURE_NAMES.accounts, []),
    ).toBeUndefined();
  });

  it('user storage: delete one feature entry', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    const mockDelete = await handleMockUserStorageDelete();

    await userStorage.deleteItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
    );
    expect(mockDelete.isDone()).toBe(true);
  });

  it('user storage: failed to delete one feature entry', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    await handleMockUserStorageDelete({
      status: 401,
      body: {
        message: 'failed to delete storage entry',
        error: 'generic-error',
      },
    });

    await expect(() =>
      userStorage.deleteItem(
        `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
      ),
    ).rejects.toThrow(UserStorageError);
  });

  it('user storage: feature entry to delete not found', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    await handleMockUserStorageDelete({
      status: 404,
      body: {},
    });

    await expect(
      userStorage.deleteItem(
        `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it('user storage: delete all feature entries', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    const mockDelete = await handleMockUserStorageDeleteAllFeatureEntries();

    await userStorage.deleteAllFeatureItems(
      USER_STORAGE_FEATURE_NAMES.notifications,
    );
    expect(mockDelete.isDone()).toBe(true);
  });

  it('user storage: failed to delete all feature entries', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    await handleMockUserStorageDeleteAllFeatureEntries({
      status: 401,
      body: {
        message: 'failed to delete all feature entries',
        error: 'generic-error',
      },
    });

    await expect(
      userStorage.deleteAllFeatureItems(
        USER_STORAGE_FEATURE_NAMES.notifications,
      ),
    ).rejects.toThrow(UserStorageError);
  });

  it('user storage: failed to find feature to delete when deleting all feature entries', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    await handleMockUserStorageDeleteAllFeatureEntries({
      status: 404,
      body: {
        message: 'failed to delete all feature entries',
        error: 'generic-error',
      },
    });

    await expect(
      userStorage.deleteAllFeatureItems(
        USER_STORAGE_FEATURE_NAMES.notifications,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it('user storage: batch delete items', async () => {
    const keysToDelete: UserStorageGenericFeatureKey[] = ['0x123', '0x456'];
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    const mockPut = handleMockUserStorageBatchDelete(
      undefined,
      async (_, requestBody) => {
        // eslint-disable-next-line jest/no-conditional-in-test
        if (typeof requestBody === 'string') {
          return;
        }

        const expectedBody = keysToDelete.map((entryKey) =>
          createSHA256Hash(String(entryKey) + MOCK_STORAGE_KEY),
        );

        expect(requestBody.batch_delete).toStrictEqual(expectedBody);
      },
    );

    await userStorage.batchDeleteItems('accounts_v2', keysToDelete);
    expect(mockPut.isDone()).toBe(true);
  });

  it('returns void when trying to batch delete items with invalid data', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);
    expect(
      await userStorage.batchDeleteItems(
        USER_STORAGE_FEATURE_NAMES.accounts,
        [],
      ),
    ).toBeUndefined();
  });

  it('user storage: failed to set key', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    handleMockUserStoragePut({
      status: 401,
      body: {
        message: 'failed to insert storage entry',
        error: 'generic-error',
      },
    });

    const data = JSON.stringify(MOCK_NOTIFICATIONS_DATA);
    await expect(
      userStorage.setItem(
        `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
        data,
      ),
    ).rejects.toThrow(UserStorageError);
  });

  it('user storage: failed to batch set items', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    handleMockUserStoragePut({
      status: 401,
      body: {
        message: 'failed to insert storage entries',
        error: 'generic-error',
      },
    });

    await expect(
      userStorage.batchSetItems(USER_STORAGE_FEATURE_NAMES.notifications, [
        ['notification_settings', 'value'],
      ]),
    ).rejects.toThrow(UserStorageError);
  });

  it('user storage: failed to batch delete items', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    handleMockUserStorageBatchDelete({
      status: 401,
      body: {
        message: 'failed to insert storage entries',
        error: 'generic-error',
      },
    });

    await expect(
      userStorage.batchDeleteItems(USER_STORAGE_FEATURE_NAMES.accounts, [
        'key',
        'key2',
      ]),
    ).rejects.toThrow(UserStorageError);
  });

  it('user storage: failed to get storage entry', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    await handleMockUserStorageGet({
      status: 401,
      body: {
        message: 'failed to get storage entry',
        error: 'generic-error',
      },
    });

    await expect(
      userStorage.getItem(
        `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
      ),
    ).rejects.toThrow(UserStorageError);
  });

  it('user storage: failed to get storage entries', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    await handleMockUserStorageGetAllFeatureEntries({
      status: 401,
      body: {
        message: 'failed to get storage entries',
        error: 'generic-error',
      },
    });

    await expect(
      userStorage.getAllFeatureItems(USER_STORAGE_FEATURE_NAMES.notifications),
    ).rejects.toThrow(UserStorageError);
  });

  it('user storage: key not found', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage } = arrangeUserStorage(auth);

    await handleMockUserStorageGet({
      status: 404,
      body: {
        message: 'key not found',
        error: 'cannot get key',
      },
    });

    const result = await userStorage.getItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
    );

    expect(result).toBeNull();
  });

  it('get/sets using a newly generated storage key (not in storage)', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage, mockGetStorageKey } = arrangeUserStorage(auth);
    mockGetStorageKey.mockResolvedValue(null);
    const mockAuthSignMessage = jest
      .spyOn(auth, 'signMessage')
      .mockResolvedValue(MOCK_STORAGE_KEY);

    handleMockUserStoragePut();

    await userStorage.setItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
      'some fake data',
    );
    expect(mockAuthSignMessage).toHaveBeenCalled(); // SignMessage called since generating new key
  });

  it('uses existing storage key (in storage)', async () => {
    const { auth } = arrangeAuth('SRP', MOCK_SRP);
    const { userStorage, mockGetStorageKey } = arrangeUserStorage(auth);
    mockGetStorageKey.mockResolvedValue(MOCK_STORAGE_KEY);

    const mockAuthSignMessage = jest
      .spyOn(auth, 'signMessage')
      .mockResolvedValue(MOCK_STORAGE_KEY);

    handleMockUserStoragePut();

    await userStorage.setItem(
      `${USER_STORAGE_FEATURE_NAMES.notifications}.notification_settings`,
      'some fake data',
    );
    expect(mockAuthSignMessage).not.toHaveBeenCalled(); // SignMessage not called since key already exists
  });
});

/**
 * Mock Utility - Arrange User Storage for testing
 *
 * @param auth - mock auth to pass in
 * @returns User Storage Instance and mocks
 */
function arrangeUserStorage(auth: IBaseAuth) {
  const mockGetStorageKey =
    typedMockFn<StorageOptions['getStorageKey']>().mockResolvedValue(
      MOCK_STORAGE_KEY,
    );

  const mockSetStorageKey =
    typedMockFn<StorageOptions['setStorageKey']>().mockResolvedValue();

  const userStorage = new UserStorage(
    {
      auth,
      env: Env.PRD,
    },
    {
      storage: {
        getStorageKey: mockGetStorageKey,
        setStorageKey: mockSetStorageKey,
      },
    },
  );

  // Mock Auth API Calls (SRP & SIWE)
  arrangeAuthAPIs();

  return {
    userStorage,
    mockGetStorageKey,
    mockSetStorageKey,
  };
}
