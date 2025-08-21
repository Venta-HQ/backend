import { ConfigService } from '@nestjs/config';

export interface AvatarUploadOptions {
	folder: string | undefined;
	transformation: string | undefined;
}

export function buildAvatarUploadOptions(config: ConfigService): AvatarUploadOptions {
	return {
		folder: config.get<string>('CLOUDINARY_AVATAR_FOLDER') || 'avatars',
		transformation: config.get<string>('CLOUDINARY_AVATAR_PRESET') || 'avatar_512_face_auto',
	};
}
