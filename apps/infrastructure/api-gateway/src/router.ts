import { Routes } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';

export const routes: Routes = [
	{
		module: VendorModule,
		path: 'vendor',
	},
	{
		module: UserModule,
		path: 'user',
	},
];

export const modules = [VendorModule, UserModule];
