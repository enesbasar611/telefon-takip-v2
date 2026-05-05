import { google } from "googleapis";
import prisma from "@/lib/prisma";

/**
 * Gets a Google Drive client for a specific shop by finding a manager's linked account.
 */
export async function getGoogleDriveClient(shopId: string) {
    // 1. Find a user in the shop who has a Google account linked with a refresh token
    console.log(`[DRIVE DEBUG] Looking for Google account for Shop ID: ${shopId}`);
    const account = await prisma.account.findFirst({
        where: {
            provider: "google",
            refresh_token: { not: null },
            user: { shopId }
        }
    });

    if (!account) {
        throw new Error("Bu dükkan için bağlı bir Google Hesabı bulunamadı. Lütfen Ayarlar > Genel kısmından Google ile giriş yapın.");
    }

    if (!account.refresh_token) {
        throw new Error("Google erişim izni (Refresh Token) alınamadı. Lütfen çıkış yapıp tekrar 'Google ile Giriş' yapın ve izinleri onaylayın.");
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: account.refresh_token,
        access_token: account.access_token
    });

    return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * Ensures a backup folder exists in Google Drive and returns its ID.
 */
export async function ensureBackupFolder(drive: any, folderName = "Basar Teknik Yedekleri") {
    // Search for the folder
    const response = await drive.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: "files(id, name)",
        spaces: "drive",
    });

    const folders = response.data.files;
    if (folders && folders.length > 0) {
        return folders[0].id;
    }

    // Create if not exists
    const fileMetadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await drive.files.create({
        resource: fileMetadata,
        fields: "id",
    });

    return folder.data.id;
}

/**
 * Uploads a JSON backup to Google Drive.
 */
export async function uploadBackup(drive: any, folderId: string, content: object, fileName: string) {
    const fileMetadata = {
        name: fileName,
        parents: [folderId],
    };

    const media = {
        mimeType: "application/json",
        body: JSON.stringify(content, null, 2),
    };

    const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id",
    });

    return file.data.id;
}
