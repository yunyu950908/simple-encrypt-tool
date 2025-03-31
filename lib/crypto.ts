/**
 * https://developer.mozilla.org/zh-CN/docs/Web/API/AesKeyGenParams
 */
export enum EncryptAlgorithm {
  AES_CBC = "AES-CBC",
  AES_CTR = "AES-CTR",
  AES_GCM = "AES-GCM",
}

export enum DeriveAlgorithm {
  PBKDF2 = "PBKDF2",
  Argon2 = "Argon2",
}

// 将字符串转换为 ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer as ArrayBuffer;
}

// 将 ArrayBuffer 转换为 Base64 字符串
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// 将 Base64 字符串转换为 ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 从密钥字符串生成密钥
async function generateKeyWithPbkdf2(params: {
  encryptAlgorithm: EncryptAlgorithm;
  encryptKey: string;
  deriveKey: string;
}): Promise<{
  key: CryptoKey;
  salt: string;
}> {
  /**
   * https://developer.mozilla.org/zh-CN/docs/Web/API/SubtleCrypto/importKey
   */
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    stringToArrayBuffer(params.encryptKey),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const saltBuffer = stringToArrayBuffer(params.deriveKey);

  // 算法参数
  let encryptParams;
  switch (params.encryptAlgorithm) {
    case EncryptAlgorithm.AES_CBC:
      encryptParams = {
        name: EncryptAlgorithm.AES_CBC,
        length: 256,
      };
      break;
    case EncryptAlgorithm.AES_CTR:
      encryptParams = {
        name: EncryptAlgorithm.AES_CTR,
        length: 256,
      };
      break;
    case EncryptAlgorithm.AES_GCM:
      encryptParams = {
        name: EncryptAlgorithm.AES_GCM,
        length: 256,
      };
      break;
    default:
      throw new Error("不支持的算法");
  }

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    encryptParams,
    false,
    ["encrypt", "decrypt"]
  );

  return {
    key,
    salt: params.deriveKey,
  };
}

// AES 加密
export async function encryptAES(params: {
  text: string;
  encryptKey: string;
  deriveKey: string;
  encryptAlgorithm: EncryptAlgorithm;
  deriveAlgorithm: DeriveAlgorithm;
}): Promise<{
  encrypted: ArrayBuffer;
  salt: string;
}> {
  try {
    let key: CryptoKey | null = null;
    let salt: string | null = null;
    switch (params.deriveAlgorithm) {
      case DeriveAlgorithm.PBKDF2:
        const hashedKey = await generateKeyWithPbkdf2({
          encryptAlgorithm: params.encryptAlgorithm,
          encryptKey: params.encryptKey,
          deriveKey: params.deriveKey,
        });
        key = hashedKey.key;
        salt = hashedKey.salt;
        break;
      case DeriveAlgorithm.Argon2:
        break;
    }
    if (!key || !salt) {
      throw new Error("密钥生成失败");
    }
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: params.encryptAlgorithm,
        iv,
      },
      key,
      stringToArrayBuffer(params.text)
    );

    // 将 IV 和加密数据合并并转换为 Base64
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return {
      encrypted: result.buffer,
      salt,
    };
  } catch (error) {
    console.error(`${params.encryptAlgorithm} 加密错误:`, error);
    throw new Error("加密失败");
  }
}

// AES 解密
export async function decryptAES(params: {
  encrypted: ArrayBuffer;
  encryptKey: string;
  deriveKey: string;
  encryptAlgorithm: EncryptAlgorithm;
  deriveAlgorithm: DeriveAlgorithm;
}): Promise<{
  decrypted: string;
  salt: string;
}> {
  try {
    const encryptedData = new Uint8Array(params.encrypted);
    const iv = encryptedData.slice(0, 16);
    const data = encryptedData.slice(16);

    const { key, salt } = await generateKeyWithPbkdf2({
      encryptAlgorithm: params.encryptAlgorithm,
      encryptKey: params.encryptKey,
      deriveKey: params.deriveKey,
    });
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: params.encryptAlgorithm,
        iv: new Uint8Array(iv),
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return {
      decrypted: decoder.decode(decrypted),
      salt,
    };
  } catch (error) {
    console.error(`${params.encryptAlgorithm} 解密错误:`, error);
    throw new Error("解密失败，请检查密钥和加密文本是否正确");
  }
}

// // Triple DES 加密
// export async function encryptTripleDES(
//   text: string,
//   keyString: string
// ): Promise<string> {
//   try {
//     const key = await generateKey("DES-EDE3-CBC", keyString);
//     const iv = window.crypto.getRandomValues(new Uint8Array(8));
//     const encrypted = await window.crypto.subtle.encrypt(
//       {
//         name: "DES-EDE3-CBC",
//         iv,
//       },
//       key,
//       stringToArrayBuffer(text)
//     );

//     // 将 IV 和加密数据合并并转换为 Base64
//     const result = new Uint8Array(iv.length + encrypted.byteLength);
//     result.set(iv);
//     result.set(new Uint8Array(encrypted), iv.length);

//     return arrayBufferToBase64(result.buffer);
//   } catch (error) {
//     console.error("Triple DES 加密错误:", error);
//     throw new Error("加密失败");
//   }
// }

// // Triple DES 解密
// export async function decryptTripleDES(
//   encryptedBase64: string,
//   keyString: string
// ): Promise<string> {
//   try {
//     const encryptedData = base64ToArrayBuffer(encryptedBase64);
//     const iv = encryptedData.slice(0, 8);
//     const data = encryptedData.slice(8);

//     const key = await generateKey("DES-EDE3-CBC", keyString);
//     const decrypted = await window.crypto.subtle.decrypt(
//       {
//         name: "DES-EDE3-CBC",
//         iv: new Uint8Array(iv),
//       },
//       key,
//       data
//     );

//     const decoder = new TextDecoder();
//     return decoder.decode(decrypted);
//   } catch (error) {
//     console.error("Triple DES 解密错误:", error);
//     throw new Error("解密失败，请检查密钥和加密文本是否正确");
//   }
// }
