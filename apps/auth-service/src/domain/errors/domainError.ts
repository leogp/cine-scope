// The base now lives in the shared kernel so every service maps errors the
// same way. Re-exported here to keep the domain's error import paths stable.
export { DomainError } from '@cinescope/shared/domain'
