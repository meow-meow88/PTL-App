import { getAccessToken } from './googleAuth';

export interface DriveFolderResult {
  id: string;
  name: string;
  webViewLink: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  size?: string;
}

/**
 * Creates a dedicated inspection evidence folder in Google Drive.
 * Example name: "PTL Evidence - K. Mazen (Green Mile Villa) - PTL-INSP-20260904"
 */
export const createInspectionFolder = async (params: {
  customerName: string;
  propertyLocation?: string;
  jobId: string;
}): Promise<DriveFolderResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive access token missing. Please sign in with Google.');
  }

  const cleanCustomer = params.customerName.trim() || 'Client';
  const locationTag = params.propertyLocation ? ` (${params.propertyLocation.split(',')[0].trim()})` : '';
  const folderName = `PTL Evidence - ${cleanCustomer}${locationTag} - ${params.jobId}`;

  // 1. Create Folder
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: `Phuket Trusted Local Field Inspection Evidence Photos for ${cleanCustomer}. Job ID: ${params.jobId}`,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Drive folder creation error:', errText);
    throw new Error(`Google Drive API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const folderId = data.id;
  const webViewLink =
    data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`;

  // 2. Set 'Anyone with link can view' permission for seamless client access
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
        allowFileDiscovery: false,
      }),
    });
  } catch (permErr) {
    // If corporate domain restricts public sharing, folder is still created and accessible to owner
    console.warn('Could not set public view permission on folder:', permErr);
  }

  return {
    id: folderId,
    name: folderName,
    webViewLink,
  };
};

/**
 * Upload a photo (from base64 data URL or File or Blob) into a specific Google Drive folder.
 */
export const uploadPhotoToDriveFolder = async (params: {
  folderId: string;
  fileName: string;
  dataUrlOrBlob: string | Blob | File;
}): Promise<DriveFileItem> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive access token missing. Please sign in with Google.');
  }

  let blob: Blob;
  let mimeType = 'image/jpeg';

  if (typeof params.dataUrlOrBlob === 'string') {
    if (params.dataUrlOrBlob.startsWith('data:')) {
      const parts = params.dataUrlOrBlob.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      const byteCharacters = atob(parts[1]);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      blob = new Blob(byteArrays, { type: mimeType });
    } else {
      // SVG or plain url fallback
      blob = new Blob([params.dataUrlOrBlob], { type: 'image/svg+xml' });
      mimeType = 'image/svg+xml';
    }
  } else {
    blob = params.dataUrlOrBlob;
    mimeType = params.dataUrlOrBlob.type || 'image/jpeg';
  }

  const metadata = {
    name: params.fileName.endsWith('.jpg') || params.fileName.endsWith('.png')
      ? params.fileName
      : `${params.fileName}.jpg`,
    parents: [params.folderId],
    mimeType,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;
  const mediaHeader = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;

  const metaBlob = new Blob([metadataPart, mediaHeader]);
  const endBlob = new Blob([closeDelimiter]);
  const multipartBlob = new Blob([metaBlob, blob, endBlob], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink,createdTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: multipartBlob,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Google Drive photo upload failed:', err);
    throw new Error(`Upload to Google Drive failed: ${err}`);
  }

  return (await response.json()) as DriveFileItem;
};

/**
 * List files inside the job's Google Drive folder
 */
export const listFolderFiles = async (folderId: string): Promise<DriveFileItem[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  const query = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,webViewLink,thumbnailLink,createdTime,size)&orderBy=createdTime desc&pageSize=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Delete a file from Google Drive
 */
export const deleteDriveFile = async (fileId: string): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Delete drive file error:', err);
    return false;
  }
};

