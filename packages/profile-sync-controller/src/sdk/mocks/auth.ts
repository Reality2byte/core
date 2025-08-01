import { Env, Platform } from '../../shared/env';
import {
  NONCE_URL,
  SIWE_LOGIN_URL,
  SRP_LOGIN_URL,
  OIDC_TOKEN_URL,
  PAIR_IDENTIFIERS,
  PROFILE_LINEAGE_URL,
} from '../authentication-jwt-bearer/services';

export const MOCK_NONCE_URL = NONCE_URL(Env.PRD);
export const MOCK_SRP_LOGIN_URL = SRP_LOGIN_URL(Env.PRD);
export const MOCK_OIDC_TOKEN_URL = OIDC_TOKEN_URL(Env.PRD);
export const MOCK_SIWE_LOGIN_URL = SIWE_LOGIN_URL(Env.PRD);
export const MOCK_PAIR_IDENTIFIERS_URL = PAIR_IDENTIFIERS(Env.PRD);
export const MOCK_PROFILE_LINEAGE_URL = PROFILE_LINEAGE_URL(Env.PRD);

export const MOCK_JWT =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImIwNzE2N2U2LWJjNWUtNDgyZC1hNjRhLWU1MjQ0MjY2MGU3NyJ9.eyJzdWIiOiI1MzE0ODc5YWM2NDU1OGI3OTQ5ZmI4NWIzMjg2ZjZjNjUwODAzYmFiMTY0Y2QyOWNmMmM3YzdmMjMzMWMwZTRlIiwiaWF0IjoxNzA2MTEzMDYyLCJleHAiOjE3NjkxODUwNjMsImlzcyI6ImF1dGgubWV0YW1hc2suaW8iLCJhdWQiOiJwb3J0Zm9saW8ubWV0YW1hc2suaW8ifQ.E5UL6oABNweS8t5a6IBTqTf7NLOJbrhJSmEcsr7kwLp4bGvcENJzACwnsHDkA6PlzfDV09ZhAGU_F3hlS0j-erbY0k0AFR-GAtyS7E9N02D8RgUDz5oDR65CKmzM8JilgFA8UvruJ6OJGogroaOSOqzRES_s8MjHpP47RJ9lXrUesajsbOudXbuksXWg5QmWip6LLvjwr8UUzcJzNQilyIhiEpo4WdzWM4R3VtTwr4rHnWEvtYnYCov1jmI2w3YQ48y0M-3Y9IOO0ov_vlITRrOnR7Y7fRUGLUFmU5msD8mNWRywjQFLHfJJ1yNP5aJ8TkuCK3sC6kcUH335IVvukQ';

export const MOCK_ACCESS_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export const MOCK_NONCE_RESPONSE = {
  nonce: 'xGMm9SoihEKeAEfV',
  identifier: '0xd8641601Cb79a94FD872fE42d5b4a067A44a7e88',
  expires_in: 300,
};

export const MOCK_SIWE_LOGIN_RESPONSE = {
  token: MOCK_JWT,
  expires_in: 3600,
  profile: {
    profile_id: 'fa2bbf82-bd9a-4e6b-aabc-9ca0d0319b6e',
    metametrics_id: 'de742679-4960-4977-a415-4718b5f8e86c',
    identifier_id:
      'ec9a4e9906836497efad2fd4d4290b34d2c6a2c0d93eb174aa3cd88a133adbaf',
    identifier_type: 'SIWE',
    encrypted_storage_key: '2c6a2c0d93eb174aa3cd88a133adbaf',
  },
};

export const MOCK_SRP_LOGIN_RESPONSE = {
  token: MOCK_JWT,
  expires_in: 3600,
  profile: {
    profile_id: 'f88227bd-b615-41a3-b0be-467dd781a4ad',
    metametrics_id: '561ec651-a844-4b36-a451-04d6eac35740',
    identifier_id:
      'da9a9fc7b09edde9cc23cec9b7e11a71fb0ab4d2ddd8af8af905306f3e1456fb',
    identifier_type: 'SRP',
    encrypted_storage_key: 'd2ddd8af8af905306f3e1456fb',
  },
};

export const MOCK_OIDC_TOKEN_RESPONSE = {
  access_token: MOCK_ACCESS_JWT,
  expires_in: 3600,
};

export const MOCK_USER_PROFILE_LINEAGE_RESPONSE = {
  profile_id: 'f88227bd-b615-41a3-b0be-467dd781a4ad',
  created_at: '2025-10-01T12:00:00Z',
  lineage: [
    {
      metametrics_id: '561ec651-a844-4b36-a451-04d6eac35740',
      agent: Platform.MOBILE,
      created_at: '2025-10-01T12:00:00Z',
      updated_at: '2025-10-01T12:00:00Z',
      counter: 1,
    },
    {
      metametrics_id: 'de742679-4960-4977-a415-4718b5f8e86c',
      agent: Platform.EXTENSION,
      created_at: '2025-10-01T12:00:00Z',
      updated_at: '2025-10-01T12:00:00Z',
      counter: 2,
    },
  ],
};
