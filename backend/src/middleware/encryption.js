import { decryptField, encryptField } from '../utils/encryption.js';

export { encryptField, decryptField };

export function encryptPatientPayload(payload) {
  return {
    ...payload,
    nameEncrypted: encryptField(payload.name),
    dobEncrypted: encryptField(payload.dob),
    phoneEncrypted: encryptField(payload.phone),
    emailEncrypted: payload.email ? encryptField(payload.email) : null,
    addressEncrypted: payload.address ? encryptField(payload.address) : null
  };
}

export function decryptPatientRecord(record) {
  return {
    ...record,
    name: decryptField(record.nameEncrypted),
    dob: decryptField(record.dobEncrypted),
    phone: decryptField(record.phoneEncrypted),
    email: record.emailEncrypted ? decryptField(record.emailEncrypted) : null,
    address: record.addressEncrypted ? decryptField(record.addressEncrypted) : null
  };
}
