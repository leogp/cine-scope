// The base now lives in the shared kernel so every service maps errors the
// same way. Re-exported here to keep the application's error import paths stable.
export { ApplicationError } from '@cinescope/shared/application'
