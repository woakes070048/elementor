import { Page, TestInfo } from '@playwright/test';
import ApiRequests from '../../../assets/api-requests';
import WpAdminPage from '../../../pages/wp-admin-page';
import { timeouts } from '../../../config/timeouts';

export const getInSettingsTab = async ( page: Page, testInfo: TestInfo, apiRequests: ApiRequests, innerPanel: string, styleguideOpen: boolean ) => {
	const wpAdmin = new WpAdminPage( page, testInfo, apiRequests );
	const editor = await wpAdmin.openNewPage();
	page.setDefaultTimeout( timeouts.longAction );

	await page.evaluate( ( isOpen ) => $e.run( 'document/elements/settings', {
		container: elementor.settings.editorPreferences.getEditedView().getContainer(),
		settings: {
			enable_styleguide_preview: isOpen ? 'yes' : '',
		},
		options: {
			external: true,
		},
	} ), styleguideOpen );

	await page.waitForTimeout( 3000 );

	await Promise.all( [
		page.waitForResponse( '/wp-admin/admin-ajax.php' ),
		editor.openSiteSettings( innerPanel ),
	] );

	await page.waitForTimeout( 1000 );

	return { editor };
};
