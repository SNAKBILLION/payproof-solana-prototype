const DATABASE_NAME = "payproof-private-vault";
const DATABASE_VERSION = 1;
const KEY_ID = "case-encryption-key";
const CASE_ID = "PP-2048";

type EncryptedRecord = {
  iv: number[];
  ciphertext: ArrayBuffer;
  updatedAt: string;
};

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Browser vault request failed."));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Browser vault transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Browser vault transaction aborted."));
  });
}

async function openVault() {
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains("keys")) database.createObjectStore("keys");
    if (!database.objectStoreNames.contains("cases")) database.createObjectStore("cases");
  };
  return requestResult(request);
}

async function encryptionKey(database: IDBDatabase) {
  const read = database.transaction("keys", "readonly");
  const existing = await requestResult(read.objectStore("keys").get(KEY_ID)) as CryptoKey | undefined;
  await transactionDone(read);
  if (existing) return existing;

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const write = database.transaction("keys", "readwrite");
  write.objectStore("keys").put(key, KEY_ID);
  await transactionDone(write);
  return key;
}

export async function saveVaultState(value: unknown) {
  const database = await openVault();
  try {
    const key = await encryptionKey(database);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
    const transaction = database.transaction("cases", "readwrite");
    transaction.objectStore("cases").put(
      { iv: [...iv], ciphertext, updatedAt: new Date().toISOString() } satisfies EncryptedRecord,
      CASE_ID,
    );
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function loadVaultState<T>() {
  const database = await openVault();
  try {
    const transaction = database.transaction("cases", "readonly");
    const record = await requestResult(transaction.objectStore("cases").get(CASE_ID)) as EncryptedRecord | undefined;
    await transactionDone(transaction);
    if (!record) return null;
    const key = await encryptionKey(database);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(record.iv) },
      key,
      record.ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } finally {
    database.close();
  }
}

export async function clearVaultState() {
  const database = await openVault();
  try {
    const transaction = database.transaction("cases", "readwrite");
    transaction.objectStore("cases").delete(CASE_ID);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
